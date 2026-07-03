import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { MetabaseModule } from '../../adapters/metabase/metabase.module';
import { ErpnextModule } from '../../adapters/erpnext/erpnext.module';
import { AuthModule } from '../auth/auth.module';
import { TenantScopeModule } from '../../shared/tenant/tenant-scope.module';
import { FeaturesModule } from '../../shared/feature-flags/features.module';

@Module({
  imports: [MetabaseModule, ErpnextModule, AuthModule, TenantScopeModule, FeaturesModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
