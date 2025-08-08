import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private redisClient: Redis;
  constructor() {
    this.redisClient = new Redis({
      host: '127.0.0.1',
      port: 6379,
    });
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redisClient.get(key);
    if (value === null) return null;
    try {
      return JSON.parse(value);
    } catch {
      return value as unknown as T;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const stringValue = JSON.stringify(value);
    if (ttl) {
      await this.redisClient.set(key, stringValue, 'EX', ttl);
    } else {
      await this.redisClient.set(key, stringValue);
    }
  }
  
  async del(key: string): Promise<void> {
    await this.redisClient.del(key);
  }
}
