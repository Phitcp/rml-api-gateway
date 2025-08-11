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

const userTokenRedisKey = (slugId: string) => `userToken:${slugId}`;

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

  private connectedUsers = new Map<string, string>(); // socketId -> userId
  constructor(
    private jwtService: JwtService,
    private authService: AuthService,
    private logger: AppLogger,
    private redisService: RedisService,
  ) {}
  afterInit(server: Server) {
    this.logger.log('🧪 DataSyncGateway initialized successfully');
  }

  private getContext(client: AuthenticatedSocket): AppContext {
    return {
      traceId: client.handshake.headers['x-trace-id'] as string,
      user: client.user,
      token: client.handshake.headers['authorization'] as string,
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

  async handleConnection(
    client: AuthenticatedSocket,
  ) {
    try {
      this.logger.log(`🔌 New connection attempt: ${client.id}`);
      const token = client.handshake.headers?.authorization as string;
      if (!token) {
        client.disconnect();
        return;
      }

      this.attachTraceId(client);
      const context = this.getContext(client);

      const decoded = this.jwtService.verify(token.replace('Bearer ', ''));
      const redisKey = userTokenRedisKey(decoded.slugId);
      const cacheUser =
        await this.redisService.get<GetUserFromSlugResponse>(redisKey);

      let user: GetUserFromSlugResponse;
      if (cacheUser) {
        user = cacheUser;
      } else {
        user = await this.authService.getUserFromSlug(context, decoded.slugId);
        await this.redisService.set(redisKey, user, 3600);
      }
      if (!user) {
        client.disconnect();
        return;
      }
      client.userId = user.userId;
      client.user = user;

      this.connectedUsers.set(client.id, client.userId);
      client.join(`user:${client.userId}`);

      this.logger.log(`User ${client.userId} connected for data sync`);
    } catch (error) {
      this.logger.error('WebSocket authentication failed');
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.connectedUsers.delete(client.id);
      this.logger.log(`User ${client.userId} disconnected from sync`);
    }
  }

  // Optional: Handle ping for connection health
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: AuthenticatedSocket) {
    client.emit('pong', { timestamp: new Date() });
  }

  // Main method: Broadcast data changes to user
  syncUserData(userId: string, dataType: string, updatedData: any) {
    this.server.to(`user:${userId}`).emit('dataSync', {
      type: dataType,
      data: updatedData,
      timestamp: new Date(),
    });

    this.logger.log(`Synced ${dataType} data to user ${userId}`);
  }

  // Sync specific data types
  syncExpData(userId: string, expData: any) {
    this.syncUserData(userId, 'exp', expData);
  }

  syncCharacterData(userId: string, characterData: any) {
    this.syncUserData(userId, 'character', characterData);
  }

  syncUserProfile(userId: string, profileData: any) {
    this.syncUserData(userId, 'profile', profileData);
  }

  // Check if user is connected (for optimization)
  isUserConnected(userId: string): boolean {
    return Array.from(this.connectedUsers.values()).includes(userId);
  }
}
