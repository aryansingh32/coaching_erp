import { Module } from '@nestjs/common';
import { LmsController } from './lms.controller';
import { LmsService } from './lms.service';
import { MoodleModule } from '../../adapters/moodle/moodle.module';
import { AuthModule } from '../auth/auth.module';
import { FeaturesModule } from '../../shared/feature-flags/features.module';
import { MoodleTenantModule } from '../../shared/moodle/moodle-tenant.module';

@Module({
  imports: [MoodleModule, AuthModule, FeaturesModule, MoodleTenantModule],
  controllers: [LmsController],
  providers: [LmsService],
})
export class LmsModule {}
