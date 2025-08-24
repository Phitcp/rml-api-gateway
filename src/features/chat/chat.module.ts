import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AppConfigModule } from '@app/config/config.module';

import { AppLogger } from '@shared/logger';
import { ChatService } from './service/chat.service';
import { AuthModule } from '@feature/auth/auth.module';
import { ChatController } from './controller/chat.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ChatPresenceService } from './service/chat.presence.service';
import { ChatWebsocketService } from './service/chat.websocket.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [AppConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const jwt = configService.get('jwt');
        return {
          secret: jwt.jwtSecret,
          signOptions: {
            expiresIn: jwt.expiresIn,
          },
        };
      },
    }),
    ClientsModule.register([
      {
        name: 'CHAT_SERVICE',
        transport: Transport.GRPC,
        options: {
          package: 'chat',
          protoPath: 'src/proto/chat.proto',
          url: '0.0.0.0:4005',
        },
      },
    ]),
    AuthModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, AppLogger, ChatPresenceService, ChatWebsocketService],
  exports: [ChatModule, ChatWebsocketService],
})
export class ChatModule {}
