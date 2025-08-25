import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from '@feature/auth/auth.module';
import { AppLogger } from './shared-libs/logger';
import { APP_FILTER } from '@nestjs/core';
import { ExceptionHandler } from './shared-libs/exception-filter';
import { RequestLogMiddleWare } from './shared-libs/middlewares/request-log.middleware';
import { ConfigService } from '@nestjs/config';
import { AppConfigModule } from './config/config.module';
import { CharacterModule } from '@feature/character/character.module';
import { ExpModule } from '@feature/exp/exp.module';
import { RedisModule } from './redis/redis.module';
import { DataSyncModule } from '@feature/data-sync/data-sync.module';
import { ChatModule } from '@feature/chat/chat.module';
import { WebsocketRouterModule } from '@feature/websocket/websocket.module';
import { NotificationModule } from '@feature/notification/notification.module';

@Module({
  imports: [
    AppConfigModule,
    DataSyncModule,
    ChatModule,
    AuthModule,
    CharacterModule,
    ExpModule,
    RedisModule,
    WebsocketRouterModule,
    NotificationModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    ConfigService,
    AppLogger,
    {
      provide: APP_FILTER,
      useClass: ExceptionHandler,
    },
  ],
  exports: [AppLogger],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLogMiddleWare).forRoutes('*');
  }
}
