import { ChatPresenceService } from './chat.presence.service';
import { Injectable } from '@nestjs/common';
import { ChatMessage } from '@root/proto-interface/chat.proto.interface';
import { AppContext } from '@shared/decorator/context.decorator';
import { RedisService } from '@root/redis/redis.service';
import { AppLogger } from '@shared/logger';
import { Server, Socket } from 'socket.io';

import { customAlphabet } from 'nanoid';

import { chatRoom_Prefix } from '@feature/websocket/constant';
import { ChatService } from './chat.service';

export interface ChatAuthenticatedSocket extends Socket {
  userId: string;
  user?: any;
  receiverId: string;
  receiver?: any;
  roomId: string;
}

export interface ChatJoinRoomPayload {
  roomId: string;
  userId: string;
  receiverIdList?: string[];
}

export interface SocketSendMessagePayload {
  receiverIdList: string[];
  content: string;
}
@Injectable()
export class ChatWebsocketService {
  private server: Server;

  constructor(
    private appLogger: AppLogger,
    private chatPresenceService: ChatPresenceService,
    private redisService: RedisService,
    private chatService: ChatService,
  ) {}

  // #region websockets
  async setServer(server: Server) {
    this.server = server;
  }

  async joinRoom(
    client: ChatAuthenticatedSocket,
    payload: ChatJoinRoomPayload,
  ) {
    const roomId = payload.roomId
      ? payload.roomId
      : `${chatRoom_Prefix}${this.createChatRoomId()}`;

    client.roomId = roomId;
    client.join(roomId);

    this.server.to(roomId).emit('chat:joinRoomSuccess', { userId: client.userId });
    this.appLogger.log(
      `User ${client.userId} connected to chat room ${roomId}`,
    );
  }

  private createChatRoomId(): string {
    const code = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 20)();
    return code;
  }

  async sendMessage(
    context: AppContext,
    client: any,
    message: SocketSendMessagePayload,
  ): Promise<void> {
    this.chatService
      .sendMessage(context, {
        roomId: client.roomId,
        userId: context.user.userId,
        userSlugId: context.user.slugId,
        participants: message.receiverIdList,
        content: message.content,
      })
      .then(async (res) => {
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
    client.to(payload.roomId).emit('chat:receiveMessage', { message: payload });

    // Step 2: Send notifications to users NOT actively in the room
    await this.sendSmartNotifications(context, payload.roomId, payload);
  }

  private async sendSmartNotifications(
    context: AppContext,
    roomId: string,
    message: ChatMessage,
  ) {
    // const participants = this.extractParticipants(message.roomId);
    // for (const userId of participants) {
    //   if (userId === message.userId) continue;

    //   const isActiveInRoom = await this.chatPresenceService.isUserActiveInRoom(
    //     userId,
    //     roomId,
    //   );
    //   const isOnline = await this.chatPresenceService.isUserOnline(userId);

    //   if (!isActiveInRoom) {
    //     await this.chatPresenceService.incrementUnreadCount(userId, roomId);

    //     if (isOnline) {
          await this.redisService.client.publish(
            `notification:send`,'Test websocket notification')
      //   } else {
      //     this.appLogger.log(
      //       `Queuing push notification for offline user: ${userId}`,
      //     );
      //   }
      // }
      // If user is actively in the room, they already got the message via receiveMessage
    // }
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
