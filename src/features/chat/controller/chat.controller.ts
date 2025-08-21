import {
  Controller,
  Post,
  Body,
  HttpStatus,
  Get,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AppContext, Context } from '@shared/decorator/context.decorator';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RbacGuard, RbacMeta } from '@shared/guard/rbac.guard';
import { ChatService } from '../service/chat.service';
import { GetChatHistoryRequest } from '@root/proto-interface/chat.proto.interface';
import { JwtGuard } from '@shared/guard/jwt-auth.guard';
import { GetChatHistoryRequestDto, GetChatHistoryResponseVO } from '../dto/chat.dto';

@ApiTags('Chat')
@Controller('chat')
@UseGuards(JwtGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}
  @UseGuards(RbacGuard)
  @RbacMeta({
    resource: 'chat_data',
    action: 'read:own',
  })
  @ApiOperation({ summary: 'Get chat history' })
  @ApiBody({
      description: 'Get chat history body',
      required: true,
      type: GetChatHistoryRequestDto,
    })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Hello',
    type: GetChatHistoryResponseVO,
  })
  @Post('/get-history')
  async getChatHistory(
    @Context() context: AppContext,
    @Body() body: GetChatHistoryRequestDto,
  ) {
    return await this.chatService.getChatHistory(context, body);
  }
}
