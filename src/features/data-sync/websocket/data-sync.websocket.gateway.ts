import { RedisService } from '@root/redis/redis.service';
import {
  WebSocketGateway,
  ConnectedSocket,
  SubscribeMessage,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '@feature/auth/service/auth.service';
import { AppLogger } from '@shared/logger';
import { DataSyncService } from '../service/data-sync.service';
import { BaseWebSocketGateway, BaseAuthenticatedSocket } from '@root/helper-service/websocket/base-websocket.gateway';

interface DataSyncAuthenticatedSocket extends BaseAuthenticatedSocket {
  // Add any data-sync specific properties here if needed
}

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/data-sync-socket',
})
export class DataSyncGateway extends BaseWebSocketGateway<DataSyncAuthenticatedSocket> {
  constructor(
    jwtService: JwtService,
    authService: AuthService,
    logger: AppLogger,
    redisService: RedisService,
    private dataSyncService: DataSyncService,
  ) {
    super(jwtService, authService, logger, redisService);
  }

  getGatewayName(): string {
    return 'data-sync';
  }

  async afterInit(): Promise<void> {
    await this.dataSyncService.setServer(this.server);
    await this.dataSyncService.subscribeToSyncEvent();
    this.logger.log('DataSyncGateway initialized and subscriptions set up');
  }

  async handlePostAuthentication(client: DataSyncAuthenticatedSocket): Promise<void> {
    client.join(`user:${client.userId}`);
    this.logger.log(`User ${client.userId} connected for data sync`);
  }

  handleDisconnect(client: DataSyncAuthenticatedSocket): void {
    if (client.userId) {
      this.server.to(`user:${client.userId}`).emit('disconnected', {
        message: 'You have been disconnected from the sync service.',
      });
      this.logger.log(`User ${client.userId} disconnected from sync`);
    }
  }
}
