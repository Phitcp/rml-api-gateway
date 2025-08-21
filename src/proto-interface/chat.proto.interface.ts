import { Metadata } from '@grpc/grpc-js';
import { Observable } from 'rxjs';

export const protobufPackage = 'chat';

export interface GetChatHistoryRequest {
  roomId: string;
  roomType: string;
  participants: string[];
  limit: number;
  skip: number;
}

export interface ChatMessage {
  roomId: string;
  messageId: string;
  content: string;
  userId: string;
  userSlugId: string;
  senderName: string;
  createdAt: number;
  updatedAt: number;
  status: string;
}

export interface GetChatHistoryResponse {
  messages: ChatMessage[];
}

export interface SendMessageRequest {
  roomId?: string;
  participants?: string[];
  content: string;
  userId: string;
  userSlugId: string;
}

export interface SendMessageResponse {
  message: ChatMessage;
}

export interface PingResponse {
  message: string;
}

export enum ChatRoomTypeEnum {
  PRIVATE = 'private',
  GROUP = 'group',
}

export type LastMessage = {
  sender: string;
  content: string;
  timestamp: Date;
};

export interface ChatRoom {
  roomId: string;

  roomType: ChatRoomTypeEnum;

  lastMessage: LastMessage;

  participants: string[];

  metadata: { 
    name?: string; // Group name
    description?: string; // Group description
    avatar?: string; // Group avatar URL
  };

  createdAt: Date | string;

  updatedAt: Date | string;
}
export interface GetRoomsDataRequest {
  roomIds: string[];
}

export interface GetRoomsDataResponse {
  rooms: ChatRoom[];
}

export const CHAT_PACKAGE_NAME = 'chat';

export interface ChatServiceClient {
  getChatHistory(
    request: GetChatHistoryRequest,
    metadata: Metadata
  ): Observable<GetChatHistoryResponse>;

  sendMessage(request: SendMessageRequest, metaData: Metadata): Observable<SendMessageResponse>;

  ping(param: any): Observable<PingResponse>;

  getRoomsData(
    request: GetRoomsDataRequest,
    metadata: Metadata
  ): Observable<GetRoomsDataResponse>;
}
