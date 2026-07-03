import { Module } from '@nestjs/common';
import { ProxyController } from './proxy.controller';
import { ProxyService } from './proxy.service';
import { ErpnextModule } from '../../adapters/erpnext/erpnext.module';
import { MoodleModule } from '../../adapters/moodle/moodle.module';
import { AuthModule } from '../auth/auth.module';
import { TenantScopeModule } from '../../shared/tenant/tenant-scope.module';
import { FeaturesModule } from '../../shared/feature-flags/features.module';
import { MoodleProxyFeatureGuard } from './guards/moodle-proxy-feature.guard';

@Module({
  imports: [ErpnextModule, MoodleModule, AuthModule, TenantScopeModule, FeaturesModule],
  controllers: [ProxyController],
  providers: [ProxyService, MoodleProxyFeatureGuard],
})
export class ProxyModule {}
