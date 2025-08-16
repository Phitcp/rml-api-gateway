import { DataSyncService } from './data-sync.service';
import { RedisService } from '@root/redis/redis.service';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  SubscribeMessage,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '@feature/auth/service/auth.service';
import { AppLogger } from '@shared/logger';
import { AppContext } from '@shared/decorator/context.decorator';
import { v4 as idGen } from 'uuid';
import { GetUserFromSlugResponse } from '@root/proto-interface/auth.proto.interface';
import {
  ConnectedUserWs_Prefix,
  AccessToken_Prefix,
} from '@root/redis/constant';

interface AuthenticatedSocket extends Socket {
  userId: string;
  user?: any;
}

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/sync',
})
export class DataSyncGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  server: Server;

  constructor(
    private jwtService: JwtService,
    private authService: AuthService,
    private logger: AppLogger,
    private redisService: RedisService,
    private dataSyncService: DataSyncService,
  ) {}

  async afterInit() {
    this.dataSyncService.setServer(this.server);
    await this.dataSyncService.subscribeToSyncEvent();
    await this.dataSyncService.subscribeToConnectionExpiration();
    this.logger.log('DataSyncGateway initialized and subscriptions set up');
  }

  // #region connection
  private getContext(client: AuthenticatedSocket): AppContext {
    return {
      traceId: client.handshake.headers['x-trace-id'] as string,
      user: client.user,
      token: client.handshake.headers['authorization'] as string,
      sessionId: client.handshake.headers['x-session-id'] as string,
    };
  }

  private attachTraceId(client: AuthenticatedSocket) {
    if (!client.handshake.headers['x-trace-id']) {
      client.handshake.headers['x-trace-id'] = idGen();
    }
    this.logger
      .addLogContext(client.handshake.headers['x-trace-id'] as string)
      .addMsgParam('Hit server')
      .log(`Websocket connect: ${client.id}`);
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      this.logger.log(`🔌 New connection attempt: ${client.id}`);
      const token = client.handshake.auth.token as string;
      if (!token) {
        client.disconnect();
        this.logger.error('No token provided for WebSocket connection');
        return;
      }

      const decoded = this.jwtService.verify(token.replace('Bearer ', ''));
      this.attachTraceId(client);
      const context = this.getContext(client);

      // authentication session
      const redisKey = `${AccessToken_Prefix}${decoded.slugId}`;

      const user = await this.redisService.getOrSet<GetUserFromSlugResponse>(
        redisKey,
        async () =>
          await this.authService.getUserFromSlug(context, decoded.slugId),
        3600,
      );

      if (!user) {
        client.disconnect();
        return;
      }
      client.userId = user.userId;
      client.user = user;

      client.join(`user:${client.userId}`);

      // Websocket session - Make this short to reduce the connection load on server
      this.redisService.set(
        `${ConnectedUserWs_Prefix}${user.userId}`,
        true,
        3600,
      );
      this.logger.log(`User ${client.userId} connected for data sync`);
    } catch (error) {
      this.logger.error('WebSocket authentication failed');
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.redisService.del(`${ConnectedUserWs_Prefix}${client.userId}`);
      this.server.to(`user:${client.userId}`).emit('disconnected', {
        message: 'You have been disconnected from the sync service.',
      });
      this.logger.log(`User ${client.userId} disconnected from sync`);
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: AuthenticatedSocket) {
    client.emit('pong', { timestamp: new Date() });
  }
}
