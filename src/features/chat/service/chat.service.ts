import { AuthService } from './../../auth/service/auth.service';
import { ChatPresenceService } from './chat.presence.service';
import { Metadata } from '@grpc/grpc-js';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import {
  ChatMessage,
  ChatServiceClient,
  GetChatHistoryRequest,
  SendMessageRequest,
  SendMessageResponse,
} from '@root/proto-interface/chat.proto.interface';
import { AppContext } from '@shared/decorator/context.decorator';
import { RedisService } from '@root/redis/redis.service';
import { AppLogger } from '@shared/logger';
import { GrpcClient } from '@shared/utilities/grpc-client';
import { firstValueFrom } from 'rxjs';
import { Server, Socket } from 'socket.io';

export interface ChatAuthenticatedSocket extends Socket {
  userId: string;
  user?: any;
  receiverId: string;
  receiver?: any;
  roomId: string;
}

@Injectable()
export class ChatService implements OnModuleDestroy {
  private grpcClient: GrpcClient<ChatServiceClient>;
  private chatServiceClient: ChatServiceClient;

  constructor(
    private appLogger: AppLogger,
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


  // socket region
 async sendMessage(context: AppContext, payload: SendMessageRequest): Promise<SendMessageResponse> {
    this.appLogger.log('Sending chat message');
    const metadata = new Metadata();
    metadata.add('x-trace-id', context.traceId);
    metadata.add('user-id', context.user.userId);

    return await firstValueFrom(
      this.chatServiceClient.sendMessage(
        {
          roomId: payload.roomId,
          participants: payload.participants,
          content: payload.content,
          userId: payload.userId,
          userSlugId: payload.userSlugId,
        },
        metadata,
      ),
    );
  }
}
