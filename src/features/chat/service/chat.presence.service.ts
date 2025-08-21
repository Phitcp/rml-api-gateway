import { Injectable } from "@nestjs/common";
import { BasePresenceService } from "@root/helper-service/presence/presence.service";
import { RedisService } from "@root/redis/redis.service";
import { AppLogger } from "@shared/logger";

@Injectable()
export class ChatPresenceService extends BasePresenceService {
  constructor(
    protected redisService: RedisService,
    protected logger: AppLogger,
  ) {
    super(redisService, logger, { prefix: 'chat' });
  }
}