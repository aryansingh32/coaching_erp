import { Module } from '@nestjs/common';
import { TestsController } from './tests.controller';
import { TestsService } from './tests.service';
import { MoodleModule } from '../../adapters/moodle/moodle.module';
import { AuthModule } from '../auth/auth.module';
import { FeaturesModule } from '../../shared/feature-flags/features.module';
import { MoodleTenantModule } from '../../shared/moodle/moodle-tenant.module';

@Module({
  imports: [MoodleModule, AuthModule, FeaturesModule, MoodleTenantModule],
  controllers: [TestsController],
  providers: [TestsService],
})
export class TestsModule {}
