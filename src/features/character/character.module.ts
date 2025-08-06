import { Module } from '@nestjs/common';

import { AppLogger } from '@shared/logger';
import { JwtModule } from '@nestjs/jwt';
import { AppConfigModule } from '@app/config/config.module';
import { ConfigService } from '@nestjs/config';
import { JwtGuard } from '@shared/guard/jwt-auth.guard';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CharacterController } from './controller/character.controller';
import { CharacterService } from './service/character.service';

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
        name: 'CHARACTER_SERVICE',
        transport: Transport.GRPC,
        options: {
          package: 'character',
          protoPath: 'src/proto/character.proto',
          url: '0.0.0.0:4003',
        },
      },
    ]),
  ],
  controllers: [CharacterController],
  providers: [ AppLogger, JwtGuard, CharacterService],
})
export class CharacterModule {}
