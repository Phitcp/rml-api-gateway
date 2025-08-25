import { Module } from '@nestjs/common';
import { AppLogger } from '@shared/logger';
import { NotificationWebsocketService } from './service/notification.websocket.service';

@Module({
  imports: [],
  providers: [ NotificationWebsocketService, AppLogger ],
  exports: [NotificationModule, NotificationWebsocketService],
})
export class NotificationModule {}
