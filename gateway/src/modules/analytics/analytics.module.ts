import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { MetabaseModule } from '../../adapters/metabase/metabase.module';
import { ErpnextModule } from '../../adapters/erpnext/erpnext.module';

@Module({
  imports: [MetabaseModule, ErpnextModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
