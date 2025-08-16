import { Module } from '@nestjs/common';

import { AppLogger } from '@shared/logger';
import { JwtModule } from '@nestjs/jwt';
import { AppConfigModule } from '@app/config/config.module';
import { ConfigService } from '@nestjs/config';
import { JwtGuard } from '@shared/guard/jwt-auth.guard';
import { AuthController } from './controller/auth.controller';
import { AuthService } from './service/auth.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { RbacService } from './service/rbac.service';
import { RbacController } from './controller/rbac.controller';
import { AppModule } from '@root/app.module';

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
        name: 'AUTH_SERVICE',
        transport: Transport.GRPC,
        options: {
          package: 'auth',
          protoPath: 'src/proto/auth.proto',
          url: '0.0.0.0:4001',
        },
      },
      {
        name: 'RBAC_SERVICE',
        transport: Transport.GRPC,
        options: {
          package: 'rbac',
          protoPath: 'src/proto/rbac.proto',
          url: '0.0.0.0:4002',
        },
      },
    ]),
  ],
  controllers: [AuthController, RbacController],
  providers: [ AppLogger, JwtGuard, AuthService, RbacService],
  exports: [AuthService]
})
export class AuthModule {}
