import { RedisService } from '@root/redis/redis.service';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { AppLogger } from '@shared/logger';
import { ConnectedUserWs_Prefix } from '@root/redis/constant';
import { Server } from 'socket.io';
import { Redis } from 'ioredis';

@Injectable()
export class DataSyncService implements OnModuleDestroy {
  private server: Server;
  private static syncSubscriber: Redis | null;

  constructor(
    private redisService: RedisService,
    private logger: AppLogger,
  ) {}

  async setServer(server: Server) {
    this.server = server;
  }

  async subscribeToSyncEvent() {
    if (!DataSyncService.syncSubscriber) {
      DataSyncService.syncSubscriber = this.redisService.client.duplicate();
      await DataSyncService.syncSubscriber.subscribe('sync-data');

      DataSyncService.syncSubscriber.on('message', async (channel, message: string) => {
        try {
          console.log('Send sub message');
          const { context, payload } = JSON.parse(message);
          const { id, dataType, updatedData } = payload;

          const isUserConnected = await this.isUserConnected(payload.id);
          if (isUserConnected) {
            this.syncUserData(id, dataType, payload);
            this.resetUserSocketSession(id);
          } else {
            const sockets = await this.server.in(`user:${id}`).fetchSockets();
            sockets.forEach((socket) => socket.disconnect(true));
          }
        } catch (error) {
          this.logger.error('Failed to process sync-data event');
        }
      });
    }
  }

  // ✅ Proper cleanup when module is destroyed
  async onModuleDestroy() {
    if (DataSyncService.syncSubscriber) {
      await DataSyncService.syncSubscriber.quit();
      DataSyncService.syncSubscriber = null;
    }
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

    this.logger.log(`Synced data to user ${userId}`);
  }

  // #region helper function
  async isUserConnected(userId: string): Promise<boolean> {
    const connectedUsers = await this.redisService.get(
      `${ConnectedUserWs_Prefix}${userId}`,
    );
    return !!connectedUsers;
  }
}
