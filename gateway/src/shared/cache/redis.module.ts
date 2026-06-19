import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service';
import { ErpCacheService } from './erp-cache.service';

@Global()
@Module({
  providers: [RedisService, ErpCacheService],
  exports: [RedisService, ErpCacheService],
})
export class RedisModule {}
