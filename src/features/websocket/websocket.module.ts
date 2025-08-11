import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DataSyncGateway } from './gateway/websocket.gateway';
import { AppConfigModule } from '@app/config/config.module';
import { AuthService } from '@feature/auth/service/auth.service';
import { AppLogger } from '@shared/logger';

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
  ],
  providers: [DataSyncGateway, AuthService, AppLogger],
  exports: [DataSyncGateway],
})
export class WebSocketModule {}
