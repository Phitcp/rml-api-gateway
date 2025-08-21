import { RedisService } from '@root/redis/redis.service';
import {
  WebSocketGateway,
  ConnectedSocket,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '@feature/auth/service/auth.service';
import { AppLogger } from '@shared/logger';
import { UserInfo_Prefix, chatRoomPrefix } from '@root/redis/constant';
import { ChatService } from '../service/chat.service';
import { BaseWebSocketGateway, BaseAuthenticatedSocket } from '@shared/websocket/base-websocket.gateway';

interface ChatAuthenticatedSocket extends BaseAuthenticatedSocket {
  receiverId: string;
  receiver?: any;
  roomId: string;
}

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/chat-socket',
})
export class ChatServiceGateway extends BaseWebSocketGateway<ChatAuthenticatedSocket> {
  constructor(
    jwtService: JwtService,
    authService: AuthService,
    logger: AppLogger,
    redisService: RedisService,
    private chatService: ChatService,
  ) {
    super(jwtService, authService, logger, redisService);
  }

  getGatewayName(): string {
    return 'chat';
  }

  async afterInit(): Promise<void> {
    this.logger.log('Chat gateway initialized');
    await this.chatService.setServer(this.server);
  }

  async handlePostAuthentication(client: ChatAuthenticatedSocket): Promise<void> {
    try {
      const context = this.getContext(client);
      const receiverId = client.handshake.query.receiverId as string;
      const receiverRedisKey = `${UserInfo_Prefix}${receiverId}`;

      const receiver = await this.redisService.getOrSet(
        receiverRedisKey,
        async () => await this.authService.getUserFromSlug(context, receiverId),
        3600,
      );

      const chatRoomString = client.handshake.query.chatRoomId
        ? client.handshake.query.chatRoomId
        : this.createChatRoomId(client.userId, receiver.userId);

      const roomId = `${chatRoomPrefix}${chatRoomString}`;
      client.roomId = roomId;
      client.receiverId = receiver.userId;
      client.receiver = receiver;
      client.join(roomId);

      this.logger.log(`User ${client.userId} connected to chat room ${roomId}`);
    } catch (error) {
      this.logger.error(
        `Failed to connect user ${client.userId} to chat room: ${error.message}`,
      );
      throw error;
    }
  }

  private createChatRoomId(userId1: string, userId2: string): string {
    const sortedIds = [userId1, userId2].sort();
    return `${sortedIds[0]}::${sortedIds[1]}`;
  }

  handleDisconnect(client: ChatAuthenticatedSocket): void {
    if (client.userId) {
      this.logger.log(`User ${client.userId} disconnected from chat room`);
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() message: any,
    @ConnectedSocket() client: ChatAuthenticatedSocket,
  ) {
    const context = this.getContext(client);
    try {
      const result = await this.chatService.sendMessage(context, client, message);
      await this.chatService.postMessageSendProcessor(result);
    } catch (error) {
      this.logger.error(`Failed to send message: ${error.message}`);
    }
  }
}
