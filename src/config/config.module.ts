// config/config.module.ts
import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { appConfig } from './app.config';
import { jwtConfig } from './jwt.config';
import { envValidationSchema } from './env.validation';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: envValidationSchema,
      load: [ appConfig, jwtConfig],
    }),
  ],
  exports: [ConfigModule],
})
export class AppConfigModule {}
