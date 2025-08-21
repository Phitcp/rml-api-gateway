import { Metadata } from '@grpc/grpc-js';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import {
  ChatMessage,
  ChatServiceClient,
  GetChatHistoryRequest,
  PingResponse,
} from '@root/proto-interface/chat.proto.interface';
import { AppContext } from '@shared/decorator/context.decorator';

import { AppLogger } from '@shared/logger';
import { GrpcClient } from '@shared/utilities/grpc-client';
import { firstValueFrom } from 'rxjs';
import { Server } from 'socket.io';

interface MessageProcessorPayload {
  roomId: string;
  message: ChatMessage
}

@Injectable()
export class ChatService implements OnModuleDestroy {
  private grpcClient: GrpcClient<ChatServiceClient>;
  private chatServiceClient: ChatServiceClient;
  private server: Server;

  constructor(private appLogger: AppLogger) {
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
    this.appLogger.log('ChatService initialized with high-traffic gRPC configuration');
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
    }
    
    return await firstValueFrom(
      this.chatServiceClient.getChatHistory(getHistoryRequestPayload, metadata),
    );
  }

  async sendMessage(context: AppContext, client: any, message: any): Promise<any> {
    const metadata = new Metadata();
    metadata.add('x-trace-id', client.handshake.headers['x-trace-id']);
    metadata.add('user-id', client.userId);
    
    return await firstValueFrom(
      this.chatServiceClient.sendMessage(
        { 
          roomId: client.roomId,
          userId: client.userId,
          userSlugId: context.user.slugId,
          senderName: client.user.character.characterName,
          participants: [message.receiverId],
          content: message.content,
        },
        metadata,
      ),
    );
  }
  
  async postMessageSendProcessor(payload: MessageProcessorPayload) {
    this.server.to(payload.message.roomId).emit('receiveMessage', payload.message);
  }
  // #endregion
}
