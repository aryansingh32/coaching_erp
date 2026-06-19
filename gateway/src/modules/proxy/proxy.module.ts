import { Module } from '@nestjs/common';
import { ProxyController } from './proxy.controller';
import { ProxyService } from './proxy.service';
import { ErpnextModule } from '../../adapters/erpnext/erpnext.module';
import { MoodleModule } from '../../adapters/moodle/moodle.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ErpnextModule, MoodleModule, AuthModule],
  controllers: [ProxyController],
  providers: [ProxyService],
})
export class ProxyModule {}
