import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private redisClient: Redis;

  onModuleInit() {
    this.redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  onModuleDestroy() {
    this.redisClient.disconnect();
  }

  getClient(): Redis {
    return this.redisClient;
  }
}
