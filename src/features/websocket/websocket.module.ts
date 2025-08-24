import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AppConfigModule } from '@app/config/config.module';

import { AppLogger } from '@shared/logger';
import { AuthModule } from '@feature/auth/auth.module';

import { UnifiedRealtimeGateway } from './gateway/websocket.routing.gateway';
import { EventRouterService } from './service/router.service';
import { ChatModule } from '@feature/chat/chat.module';
import { DataSyncModule } from '@feature/data-sync/data-sync.module';

@Module({
  imports: [
    ChatModule,
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
    AuthModule,
    DataSyncModule
  ],
  providers: [
    UnifiedRealtimeGateway,
    AppLogger,
    EventRouterService
  ],
  exports: [UnifiedRealtimeGateway],
})
export class WebsocketRouterModule {}
