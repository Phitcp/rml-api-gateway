import { Module } from '@nestjs/common';

import { AppLogger } from '@shared/logger';
import { JwtModule } from '@nestjs/jwt';
import { AppConfigModule } from '@app/config/config.module';
import { ConfigService } from '@nestjs/config';
import { JwtGuard } from '@shared/guard/jwt-auth.guard';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { ExpResourceAdminController } from './controller/exp-admin.controller';
import { ExpAdminService } from './service/exp-admin.service';

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
        name: 'EXP_SERVICE',
        transport: Transport.GRPC,
        options: {
          package: 'exp',
          protoPath: 'src/proto/exp.proto',
          url: '0.0.0.0:4004',
        },
      },
    ]),
  ],
  controllers: [ExpResourceAdminController],
  providers: [ AppLogger, JwtGuard, ExpAdminService],
})
export class ExpModule {}
