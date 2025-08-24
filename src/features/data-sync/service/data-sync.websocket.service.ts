import { RedisService } from '@root/redis/redis.service';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { AppLogger } from '@shared/logger';
import { Server, Socket } from 'socket.io';
import { Redis } from 'ioredis';
import { AppContext } from '@shared/decorator/context.decorator';
import { dataSync_Prefix } from '@feature/websocket/constant';

export interface DataSyncAuthenticatedSocket extends Socket {
  userId: string;
  user?: any;
}

@Injectable()
export class DataSyncWebsocketService implements OnModuleDestroy, OnModuleInit {
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
    if (!DataSyncWebsocketService.syncSubscriber) {
      DataSyncWebsocketService.syncSubscriber =
        this.redisService.client.duplicate();
      await DataSyncWebsocketService.syncSubscriber.subscribe('sync-data');

      DataSyncWebsocketService.syncSubscriber.on(
        'message',
        async (channel, message: string) => {
          console.log('Send sub message');
          const { context, payload } = JSON.parse(message);
          const { id, dataType, updatedData } = payload;

          this.syncUserData(id, dataType, payload);
        },
      );
    }
  }

  async onModuleDestroy() {
    if (DataSyncWebsocketService.syncSubscriber) {
      await DataSyncWebsocketService.syncSubscriber.quit();
      DataSyncWebsocketService.syncSubscriber = null;
    }
  }

  async onModuleInit() {
    await this.subscribeToSyncEvent();
    this.logger.log('DataSyncGateway initialized and subscriptions set up');
  }

  async joinRoom(context: AppContext, client: DataSyncAuthenticatedSocket) {
    client.join(`${dataSync_Prefix}${client.userId}`);
  }

  private syncUserData(userId: string, dataType: string, updatedData: any) {
    this.server.to(`${dataSync_Prefix}${userId}`).emit('dataSync:update', {
      type: dataType,
      data: updatedData,
      timestamp: new Date(),
    });

    this.logger.log(`Synced data to user ${userId}`);
  }
}
