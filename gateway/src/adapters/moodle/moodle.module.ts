import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MoodleAdapter } from './moodle.adapter';
import { MoodleSyncService } from './moodle-sync.service';
import { ErpnextModule } from '../erpnext/erpnext.module';

@Module({
  imports: [HttpModule, ErpnextModule],
  providers: [MoodleAdapter, MoodleSyncService],
  exports: [MoodleAdapter],
})
export class MoodleModule {}
