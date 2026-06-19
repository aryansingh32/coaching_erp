import { Module } from '@nestjs/common';
import { TestsController } from './tests.controller';
import { TestsService } from './tests.service';
import { MoodleModule } from '../../adapters/moodle/moodle.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [MoodleModule, AuthModule],
  controllers: [TestsController],
  providers: [TestsService],
})
export class TestsModule {}
