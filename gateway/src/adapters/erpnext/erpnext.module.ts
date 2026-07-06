import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { EducationAdapter } from './education.adapter';
import { CacheModule } from '@nestjs/cache-manager';
import { ErpCacheService } from '../../infrastructure/cache/erp-cache.service';

@Module({
  imports: [HttpModule, CacheModule.register()],
  providers: [EducationAdapter, ErpCacheService],
  exports: [EducationAdapter, ErpCacheService],
})
export class ErpnextModule {}
