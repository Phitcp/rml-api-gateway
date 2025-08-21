import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DataSyncGateway } from './websocket/data-sync.websocket.gateway';
import { AppConfigModule } from '@app/config/config.module';

import { AppLogger } from '@shared/logger';
import { DataSyncService } from './service/data-sync.service';
import { AuthModule } from '@feature/auth/auth.module';

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
    AuthModule
  ],
  providers: [DataSyncGateway, DataSyncService, AppLogger],
  exports: [DataSyncGateway],
})
export class DataSyncModule {}
