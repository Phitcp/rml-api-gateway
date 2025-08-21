import { Injectable } from '@nestjs/common';
import { RedisService } from '@root/redis/redis.service';
import { AppLogger } from '@shared/logger';

export interface PresenceServiceConfig {
  prefix: string;
}

@Injectable()
export class BasePresenceService {
  protected readonly prefix: string;

  constructor(
    protected redisService: RedisService,
    protected logger: AppLogger,
    config: PresenceServiceConfig,
  ) {
    this.prefix = config.prefix;
  }

  protected getKey(suffix: string): string {
    return `${this.prefix}:${suffix}`;
  }

  async setActiveRoom(userId: string, roomId: string, ttl: number = 300): Promise<void> {
    const key = this.getKey(`active_room:${userId}`);
    await this.redisService.set(key, roomId, ttl);
  }

  async getActiveRoom(userId: string): Promise<string | null> {
    const key = this.getKey(`active_room:${userId}`);
    return await this.redisService.get<string>(key);
  }

  async clearActiveRoom(userId: string): Promise<void> {
    const key = this.getKey(`active_room:${userId}`);
    await this.redisService.client.del(key);
  }

  async isUserActiveInRoom(userId: string, roomId: string): Promise<boolean> {
    const activeRoom = await this.getActiveRoom(userId);
    return activeRoom === roomId;
  }

  async setUserOnline(userId: string, ttl: number = 600): Promise<void> {
    const key = this.getKey(`online:${userId}`);
    await this.redisService.set(key, Date.now().toString(), ttl);
  }

  async isUserOnline(userId: string): Promise<boolean> {
    const key = this.getKey(`online:${userId}`);
    const exists = await this.redisService.client.exists(key);
    return exists === 1;
  }

  async setUserOffline(userId: string): Promise<void> {
    const key = this.getKey(`online:${userId}`);
    await this.redisService.client.del(key);
  }

  async incrementUnreadCount(userId: string, roomId: string): Promise<number> {
    const key = this.getKey(`unread:${userId}:${roomId}`);
    return await this.redisService.client.incr(key);
  }

  async getUnreadCount(userId: string, roomId: string): Promise<number> {
    const key = this.getKey(`unread:${userId}:${roomId}`);
    const count = await this.redisService.get<string>(key);
    return parseInt(count || '0');
  }

  async clearUnreadCount(userId: string, roomId: string): Promise<void> {
    const key = this.getKey(`unread:${userId}:${roomId}`);
    await this.redisService.client.del(key);
  }
}
