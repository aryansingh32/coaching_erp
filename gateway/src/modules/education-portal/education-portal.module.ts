import { Module } from '@nestjs/common';
import { EducationPortalController } from './education-portal.controller';
import { EducationPortalService } from './education-portal.service';
import { ErpnextModule } from '../../adapters/erpnext/erpnext.module';
import { AuthModule } from '../auth/auth.module';
import { TenantScopeModule } from '../../shared/tenant/tenant-scope.module';
import { FeaturesModule } from '../../shared/feature-flags/features.module';

@Module({
  imports: [ErpnextModule, AuthModule, TenantScopeModule, FeaturesModule],
  controllers: [EducationPortalController],
  providers: [EducationPortalService],
})
export class EducationPortalModule {}
