import { Module, Global } from '@nestjs/common';
import Redis from 'ioredis';
import { RedisService } from './redis.service';

@Global() // Makes this module global
@Module({
  providers: [
    Redis,
    RedisService,
  ],
  exports: [RedisService],
})
export class RedisModule {}