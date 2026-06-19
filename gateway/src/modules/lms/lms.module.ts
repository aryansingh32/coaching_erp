import { Module } from '@nestjs/common';
import { LmsController } from './lms.controller';
import { LmsService } from './lms.service';
import { MoodleModule } from '../../adapters/moodle/moodle.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [MoodleModule, AuthModule],
  controllers: [LmsController],
  providers: [LmsService],
})
export class LmsModule {}
