import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { FeesService } from './fees.service';
import { FeesController } from './fees.controller';
import { ErpnextModule } from '../../adapters/erpnext/erpnext.module';

@Module({
  imports: [ErpnextModule, CacheModule.register()],
  controllers: [FeesController],
  providers: [FeesService],
})
export class FeesModule {}
