import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  GetChatHistoryRequest,
  GetChatHistoryResponse,
} from '@root/proto-interface/chat.proto.interface';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GetChatHistoryRequestDto implements GetChatHistoryRequest {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  roomType: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  roomId: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  participants: string[];

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNotEmpty()
  limit: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNotEmpty()
  skip: number;
}

export class ChatMessage {
  @ApiProperty()
  roomId: string;

  @ApiProperty()
  messageId: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  userSlugId: string;

  @ApiProperty()
  senderName: string;

  @ApiProperty()
  createdAt: number;

  @ApiProperty()
  updatedAt: number;

  @ApiProperty()
  status: string;
}

export class GetChatHistoryResponseVO implements GetChatHistoryResponse {
  @ApiProperty({ type: [ChatMessage] })
  messages: ChatMessage[];
}
