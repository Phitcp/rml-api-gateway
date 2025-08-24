import { EventRouterService } from '../service/router.service';
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { AppLogger } from '@shared/logger';

import { AppContext } from '@shared/decorator/context.decorator';
import { UserInfo_Prefix } from '@root/redis/constant';
import { AuthService } from '@feature/auth/service/auth.service';
import { RedisService } from '@root/redis/redis.service';
import { OnModuleInit } from '@nestjs/common';
import { DataSyncWebsocketService } from '@feature/data-sync/service/data-sync.websocket.service';
import { session_Prefix } from '../constant';

export interface AuthenticatedClient extends Socket {
  userId: string;
  user?: any;
}

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/realtime',
})
export class UnifiedRealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    protected logger: AppLogger,
    protected authService: AuthService,
    protected redisService: RedisService,
    private eventRouterService: EventRouterService,
    private dataSyncWebsocketService: DataSyncWebsocketService,
  ) {}

  async onModuleInit() {
    // Inject server instance into services that need pub-sub
    this.dataSyncWebsocketService.setServer(this.server);
  }
  
  protected getContext(client: AuthenticatedClient): AppContext {
    return {
      traceId: client.id,
      user: client.user,
      token: client.handshake.auth.token as string,
      sessionId: client.handshake.query.sessionId as string,
    };
  }
  async handleConnection(client: AuthenticatedClient) {
    try {
      await this.authenticateClient(client);
      this.logger.log(
        `Client connected: ${client.id} for user: ${client.userId}`,
      );
    } catch (error) {
      this.logger.error(`Authentication failed for client: ${client.id}`);
      client.disconnect();
    }
  }

  protected async authenticateClient(
    client: AuthenticatedClient,
  ): Promise<void> {
    try {
      this.logger.log(`🔌 New connection attempt: ${client.id}`);
      const token = client.handshake.auth.token as string;

      if (!token) {
        throw new Error('No token provided for WebSocket connection');
      }

      if (!token.startsWith('Bearer ')) {
        throw new Error('Invalid token format for WebSocket connection');
      }

      const decoded = this.jwtService.verify(token.replace('Bearer ', ''));
      const context = this.getContext(client);

      // authentication session
      const redisKey = `${UserInfo_Prefix}${decoded.slugId}`;

      const user = await this.redisService.getOrSet(
        redisKey,
        async () =>
          await this.authService.getUserFromSlug(context, decoded.slugId),
        3600,
      );

      if (!user) {
        throw new Error('User not found or invalid');
      }

      client.userId = user.userId;
      client.user = user;

      this.logger.log(
        `User ${client.userId} authenticated for websocket connection`,
      );

      client.join(`${session_Prefix}${client.userId}`);

      this.server.to(`${session_Prefix}${client.userId}`).emit('connectSuccess', {
        message: `Joined room for user ${client.userId}`,
      });
    } catch (error) {
      this.logger.error(
        `WebSocket authentication failed for ${client.id}: ${error.message}`,
      );
      throw error;
    }
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('event')
  async handleEvent(
    @MessageBody() data: { type: string; payload: any },
    @ConnectedSocket() client: AuthenticatedClient,
  ) {
    const context = this.getContext(client);
    const [service, action] = data.type.split(':');

    return this.eventRouterService.routeEvent(
      service,
      action,
      data.payload,
      context,
      client,
      this.server,
    );
  }
}
