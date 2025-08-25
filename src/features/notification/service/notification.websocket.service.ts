import { Injectable, OnModuleInit } from '@nestjs/common';
import { RedisService } from '@root/redis/redis.service';
import { Redis } from 'ioredis';
import { Server } from 'socket.io';

@Injectable()
export class NotificationWebsocketService implements OnModuleInit {
  private server: Server;
  private static notificationSubscriber: Redis | null;

  
  constructor(private redisService: RedisService) {}

  setServer(server: any) {
    this.server = server;
  }
  async subscribeToNotificationEvent() {
    if (!NotificationWebsocketService.notificationSubscriber) {
      NotificationWebsocketService.notificationSubscriber =
        this.redisService.client.duplicate();
    }

    await NotificationWebsocketService.notificationSubscriber.subscribe(
      'notification:send',
    );

    NotificationWebsocketService.notificationSubscriber.on(
      'message',
      async (channel, message: string) => {
        console.log(channel);
        console.log(message);
        // Will send notification real time for user here. But implement later after we have the frontend
      },
    );
  }

    async onModuleInit() {
    await this.subscribeToNotificationEvent();
  }

}
