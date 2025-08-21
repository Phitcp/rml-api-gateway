import { ChatPresenceService } from './chat.presence.service';
import { Metadata } from '@grpc/grpc-js';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import {
  ChatMessage,
  ChatServiceClient,
  GetChatHistoryRequest,
  PingResponse,
  SendMessageResponse,
} from '@root/proto-interface/chat.proto.interface';
import { AppContext } from '@shared/decorator/context.decorator';
import { RedisService } from '@root/redis/redis.service';
import { AppLogger } from '@shared/logger';
import { GrpcClient } from '@shared/utilities/grpc-client';
import { firstValueFrom } from 'rxjs';
import { Server } from 'socket.io';

@Injectable()
export class ChatService implements OnModuleDestroy {
  private grpcClient: GrpcClient<ChatServiceClient>;
  private chatServiceClient: ChatServiceClient;
  private server: Server;

  constructor(
    private appLogger: AppLogger,
    private chatPresenceService: ChatPresenceService,
    private redisService: RedisService,
  ) {
    // High-traffic service configuration with connection pooling
    this.grpcClient = new GrpcClient<ChatServiceClient>({
      package: 'chat',
      protoPath: 'src/proto/chat.proto',
      url: '0.0.0.0:4005',
      serviceName: 'ChatService',
      // Optimized for high-traffic chat operations
      keepaliveTimeMs: 20000,
      keepaliveTimeoutMs: 3000,
      maxConnectionAge: 180000,
      maxReceiveMessageLength: 8388608,
    });

    this.chatServiceClient = this.grpcClient.getService();
    this.appLogger.log(
      'ChatService initialized with high-traffic gRPC configuration',
    );
  }

  async onModuleDestroy() {
    await this.grpcClient.close();
    this.appLogger.log('ChatService destroyed');
  }

  // #region websockets
  async ping(): Promise<PingResponse> {
    this.appLogger.log('Ping to chat service');
    return await firstValueFrom(this.chatServiceClient.ping({}));
  }

  async setServer(server: Server) {
    this.server = server;
  }
  // #endregion

  // #region http request
  async getChatHistory(
    context: AppContext,
    payload: GetChatHistoryRequest,
  ): Promise<any> {
    this.appLogger.log('Getting chat history');
    const metadata = new Metadata();
    metadata.add('x-trace-id', context.traceId);
    metadata.add('user-id', context.user.userId);

    const getHistoryRequestPayload = {
      userId: context.user.userId,
      roomId: payload.roomId,
      roomType: payload.roomType,
      participants: payload.participants,
      limit: payload.limit,
      skip: payload.skip,
    };

    return await firstValueFrom(
      this.chatServiceClient.getChatHistory(getHistoryRequestPayload, metadata),
    );
  }

  async sendMessage(
    context: AppContext,
    client: any,
    message: any,
  ): Promise<SendMessageResponse> {
    const metadata = new Metadata();
    metadata.add('x-trace-id', context.traceId);

    return await firstValueFrom(
      this.chatServiceClient.sendMessage(
        {
          roomId: client.roomId,
          userId: context.user.userId,
          userSlugId: context.user.slugId,
          participants: [message.receiverId],
          content: message.content,
        },
        metadata,
      ),
    );
  }

  async postMessageSendProcessor(context: AppContext, payload: ChatMessage) {
    // Step 1: Send real-time message to users actively in the room
    this.server.to(payload.roomId).emit('receiveMessage', { message: payload });

    // Step 2: Send notifications to users NOT actively in the room
    await this.sendSmartNotifications(context, payload.roomId, payload);
  }

  private async sendSmartNotifications(
    context: AppContext,
    roomId: string,
    message: ChatMessage,
  ) {
    const participants = this.extractParticipants(message.roomId);
    for (const userId of participants) {
      // Skip sender
      if (userId === message.userId) continue;

      // Check if user is actively viewing this chat
      const isActiveInRoom = await this.chatPresenceService.isUserActiveInRoom(
        userId,
        roomId,
      );
      const isOnline = await this.chatPresenceService.isUserOnline(userId);

      if (!isActiveInRoom) {
        // Increment unread count
        await this.chatPresenceService.incrementUnreadCount(userId, roomId);

        // Send notification based on online status
        if (isOnline) {
          // Send real-time notification via Redis pub/sub
          await this.redisService.client.publish(
            `notification:${userId}`,
            JSON.stringify({
              type: 'chat_message',
              roomId,
              senderId: message.userId,
              senderName: message.senderName || 'Unknown User',
              content: message.content,
              timestamp: message.createdAt,
              unreadCount: await this.chatPresenceService.getUnreadCount(
                userId,
                roomId,
              ),
            }),
          );
        } else {
          // Queue for push notification
          this.appLogger.log(
            `Queuing push notification for offline user: ${userId}`,
          );
        }
      }
      // If user is actively in the room, they already got the message via receiveMessage
    }
  }

  private extractParticipants(roomId: string): string[] {
    // Extract user IDs from room format: chatRoom:userId1::userId2
    const roomString = roomId.replace('chatRoom:', '');
    return roomString.split('::');
  }

  async sendSmartNotification() {
    this.appLogger.log('Sending smart notification');
    // Implementation handled by postMessageSendProcessor
  }
  // #endregion
}
