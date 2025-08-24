import { AuthService } from '../../auth/service/auth.service';
import { ChatPresenceService } from './chat.presence.service';
import { Metadata } from '@grpc/grpc-js';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import {
  ChatMessage,
  ChatServiceClient,
} from '@root/proto-interface/chat.proto.interface';
import { AppContext } from '@shared/decorator/context.decorator';
import { RedisService } from '@root/redis/redis.service';
import { AppLogger } from '@shared/logger';
import { GrpcClient } from '@shared/utilities/grpc-client';
import { firstValueFrom } from 'rxjs';
import { Server, Socket } from 'socket.io';

import { UserInfo_Prefix } from '@root/redis/constant';
import { chatRoom_Prefix } from '@feature/websocket/constant';
import { ChatService } from './chat.service';

export interface ChatAuthenticatedSocket extends Socket {
  userId: string;
  user?: any;
  receiverId: string;
  receiver?: any;
  roomId: string;
}

@Injectable()
export class ChatWebsocketService  {

  constructor(
    private appLogger: AppLogger,
    private chatPresenceService: ChatPresenceService,
    private redisService: RedisService,
    private authService: AuthService,
    private chatService: ChatService
  ) {
  }

  // #region websockets

  async joinRoom(context: AppContext, client: ChatAuthenticatedSocket, payload) {

    const receiver = await this.redisService.bulkStringKeyGetOrSet(
      UserInfo_Prefix,
      async () => await this.authService.getListUserInfoFromSlugs(context, receiverId),
      3600,
    );

    const chatRoomString = client.handshake.query.chatRoomId
      ? client.handshake.query.chatRoomId
      : this.createChatRoomId(client.userId, receiver.userId);

    const roomId = `${chatRoom_Prefix}${chatRoomString}`;
    client.roomId = roomId;
    client.join(roomId);

    this.appLogger.log(
      `User ${client.userId} connected to chat room ${roomId}`,
    );
  }

  private createChatRoomId(userId1: string, userId2: string): string {
    const sortedIds = [userId1, userId2].sort();
    return `${sortedIds[0]}::${sortedIds[1]}`;
  }

  async sendMessage(
    context: AppContext,
    client: any,
    message: any,
  ): Promise<void> {
      this.chatService.sendMessage(
        context,
        {
          roomId: client.roomId,
          userId: context.user.userId,
          userSlugId: context.user.slugId,
          participants: [message.receiverId],
          content: message.content, 
        },
      ).then(async (res) => {
        await this.postMessageSendProcessor(context, res.message, client);
      })
      .catch((error) => {
        this.appLogger.error(`Failed to send message: ${error.message}`);
      });
  }

  async postMessageSendProcessor(
    context: AppContext,
    payload: ChatMessage,
    client: ChatAuthenticatedSocket,
  ) {
    // Step 1: Send real-time message to users actively in the room
    client.to(payload.roomId).emit('receiveMessage', { message: payload });

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
