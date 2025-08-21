import { RedisService } from '@root/redis/redis.service';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketServer,
  ConnectedSocket,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '@feature/auth/service/auth.service';
import { AppLogger } from '@shared/logger';
import { AppContext } from '@shared/decorator/context.decorator';
import { UserInfo_Prefix } from '@root/redis/constant';

export interface BaseAuthenticatedSocket extends Socket {
  userId: string;
  user?: any;
}

export abstract class BaseWebSocketGateway<T extends BaseAuthenticatedSocket = BaseAuthenticatedSocket>
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  server: Server;

  constructor(
    protected jwtService: JwtService,
    protected authService: AuthService,
    protected logger: AppLogger,
    protected redisService: RedisService,
  ) {}

  // Abstract methods that must be implemented by derived classes
  abstract afterInit(): Promise<void>;
  abstract handlePostAuthentication(client: T): Promise<void>;
  abstract handleDisconnect(client: T): void;
  abstract getGatewayName(): string;

  // Common context creation
  protected getContext(client: T): AppContext {
    return {
      traceId: client.id,
      user: client.user,
      token: client.handshake.auth.token as string,
      sessionId: client.handshake.query.sessionId as string,
    };
  }

  // Common connection handler
  async handleConnection(client: T) {
    try {
      await this.authenticateClient(client);
      await this.handlePostAuthentication(client);
    } catch (error) {
      this.logger.error(
        `Authentication failed for client ${client.id}: ${error.message}`,
      );
      client.disconnect(true);
    }
  }

  // Common authentication logic
  protected async authenticateClient(client: T): Promise<void> {
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

      this.logger.log(`User ${client.userId} authenticated for ${this.getGatewayName()}`);
    } catch (error) {
      this.logger.error(
        `WebSocket authentication failed for ${client.id}: ${error.message}`,
      );
      throw error;
    }
  }

  // Common ping/pong handlers
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: T) {
    client.emit('pong', { timestamp: new Date() });
  }

  @SubscribeMessage('pong')
  handlePong(@ConnectedSocket() client: T) {
    this.logger.log(`Received pong from client ${client.id}`);
  }

  // Utility method for validation
  protected validateAuthentication(client: T): boolean {
    if (!client.userId) {
      this.logger.error('Client is not authenticated');
      return false;
    }
    return true;
  }
}
