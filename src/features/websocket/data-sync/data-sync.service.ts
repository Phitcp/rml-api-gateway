import { RedisService } from '@root/redis/redis.service';
import { CharacterService } from './../../character/service/character.service';
import { Injectable } from '@nestjs/common';
import { AppLogger } from '@shared/logger';
import { ConnectedUserWs_Prefix } from '@root/redis/constant';
import { Server, Socket } from 'socket.io';

@Injectable()
export class DataSyncService {
  private server: Server;
  constructor(
    private redisService: RedisService,
    private logger: AppLogger,
  ) {}

  async setServer(server: Server) {
    this.server = server;
  }

  async subscribeToSyncEvent() {
    const subscriber = this.redisService.client.duplicate();
    await subscriber.subscribe('sync-data');

    subscriber.on('message', async (channel, message: string) => {
      try {
        const { context, payload } = JSON.parse(message);
        const { userId, dataType, updatedData } = payload;
        const isUserConnected = await this.isUserConnected(userId);
        if (isUserConnected) {
          this.syncUserData(userId, dataType, updatedData);
          this.resetUserSocketSession(userId);
        } else {
          const sockets = await this.server.in(`user:${userId}`).fetchSockets();
          sockets.forEach((socket) => socket.disconnect(true));
        }
      } catch (error) {
        this.logger.error('Failed to process sync-data event');
      }
    });
  }

  async subscribeToConnectionExpiration() {
    const expiredSubscriber = this.redisService.client.duplicate();
    await expiredSubscriber.config('SET', 'notify-keyspace-events', 'Ex');
    await expiredSubscriber.psubscribe('__keyevent@0__:expired');

    expiredSubscriber.on('pmessage', async (pattern, channel, expiredKey) => {
      if (expiredKey.startsWith(ConnectedUserWs_Prefix)) {
        const userId = expiredKey.split('::')[1];
        this.logger.warn(`Connection session expired for user ${userId}`);
        this.server.to(`user:${userId}`).emit('sessionExpired', {
          isWebsocketSessionExpired: true,
          message: 'Your session has expired. Please reconnect.',
          timestamp: new Date(),
        });

        const sockets = await this.server.in(`user:${userId}`).fetchSockets();
        sockets.forEach((socket) => socket.disconnect(true));
      }
    });
  }

  private async resetUserSocketSession(userId: string) {
    const exists = await this.redisService.client.exists(
      `${ConnectedUserWs_Prefix}${userId}`,
    );
    if (exists) {
      await this.redisService.client.expire(
        `${ConnectedUserWs_Prefix}${userId}`,
        3600,
      );
      this.logger.log(`Reset activity TTL for user ${userId}`);
    }
  }

  private syncUserData(userId: string, dataType: string, updatedData: any) {
    this.server.to(`user:${userId}`).emit('dataSync', {
      type: dataType,
      data: updatedData,
      timestamp: new Date(),
    });

    this.logger.log(`Synced ${dataType} data to user ${userId}`);
  }

  // #region helper function
  async isUserConnected(userId: string): Promise<boolean> {
    const connectedUsers = await this.redisService.get(
      `${ConnectedUserWs_Prefix}${userId}`,
    );
    return !!connectedUsers;
  }
}
