import { Module } from '@nestjs/common';
import { MoodleTenantService } from './moodle-tenant.service';
import { MoodleModule } from '../../adapters/moodle/moodle.module';
import { TenantScopeModule } from '../tenant/tenant-scope.module';

@Module({
  imports: [MoodleModule, TenantScopeModule],
  providers: [MoodleTenantService],
  exports: [MoodleTenantService],
})
export class MoodleTenantModule {}
