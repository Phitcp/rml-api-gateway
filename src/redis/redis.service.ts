import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

export interface BulkGetOrSetStringKeyInterface {
  suffixes: string[];
  prefix: string;
  callback: () => Promise<any[]>;
  ttl?: number;
}

@Injectable()
export class RedisService implements OnModuleDestroy {
  private redisClient: Redis;
  private healthCheckInterval: NodeJS.Timeout;
  private isHealthy: boolean = true;

  constructor() {
    this.redisClient = new Redis({
      host: '127.0.0.1',
      port: 6379,
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      connectTimeout: 10000,
      commandTimeout: 5000,
    });

    this.setupEventHandlers();
    this.startHealthCheck();
  }

  private setupEventHandlers(): void {
    this.redisClient.on('connect', () => {
      console.log('Redis connected');
      this.isHealthy = true;
    });

    this.redisClient.on('ready', () => {
      console.log('Redis ready');
      this.isHealthy = true;
    });

    this.redisClient.on('error', (error) => {
      console.error('Redis error:', error);
      this.isHealthy = false;
    });

    this.redisClient.on('close', () => {
      console.log('Redis connection closed');
      this.isHealthy = false;
    });

    this.redisClient.on('reconnecting', () => {
      console.log('Redis reconnecting...');
      this.isHealthy = false;
    });
  }

  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.redisClient.ping();
        if (!this.isHealthy) {
          console.log('Redis health check passed - connection restored');
          this.isHealthy = true;
        }
      } catch (error) {
        if (this.isHealthy) {
          console.error('Redis health check failed:', error);
          this.isHealthy = false;
        }
      }
    }, 30000); // Check every 30 seconds
  }

  private async executeWithRetry<T>(operation: () => Promise<T>, maxRetries: number = 3): Promise<T | null> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        console.error(`Redis operation failed (attempt ${attempt}/${maxRetries}):`, error);
        
        if (attempt === maxRetries) {
          console.error('All Redis retry attempts failed');
          return null;
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
      }
    }
    return null;
  }

  async onModuleDestroy() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    if (this.redisClient) {
      await this.redisClient.quit();
    }
  }

  async get<T>(key: string): Promise<T | null> {
    return this.executeWithRetry(async () => {
      const value = await this.redisClient.get(key);
      if (value === null) return null;
      try {
        return JSON.parse(value);
      } catch {
        return value as unknown as T;
      }
    });
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.executeWithRetry(async () => {
      const stringValue = JSON.stringify(value);
      if (ttl) {
        await this.redisClient.set(key, stringValue, 'EX', ttl);
      } else {
        await this.redisClient.set(key, stringValue);
      }
    });
  }

  async getOrSet<K extends () => Promise<any>>(
    key: string,
    callback: K,
    ttl?: number,
  ): Promise<Awaited<ReturnType<K>>> {
    const cachedData = await this.get<Awaited<ReturnType<K>>>(key);
    if (cachedData !== null) {
      return cachedData;
    }

    const freshData = await callback();
    await this.set(key, freshData, ttl);
    return freshData as Awaited<ReturnType<K>>;
  }

  async bulkStringKeyGetOrSet<K extends () => Promise<any[]>>({
    suffixes,
    prefix,
    callback,
    ttl,
  }: BulkGetOrSetStringKeyInterface & { callback: K }): Promise<Awaited<ReturnType<K>>> {
    const cachedData = await Promise.all(
      suffixes.map((suffix) => this.get<Awaited<ReturnType<K>>[number]>(`${prefix}${suffix}`)),
    );
    const keysToFetch = suffixes.filter((_, index) => cachedData[index] === null);

    if (keysToFetch.length === 0) {
      return cachedData as Awaited<ReturnType<K>>;
    }

    const freshData = await callback();
    await Promise.all(
      keysToFetch.map((suffix, index) => this.set(`${prefix}${suffix}`, freshData[index], ttl)),
    );
    return freshData as Awaited<ReturnType<K>>;
  }

  get client(): Redis {
    return this.redisClient;
  }

  get isConnectionHealthy(): boolean {
    return this.isHealthy;
  }
}
