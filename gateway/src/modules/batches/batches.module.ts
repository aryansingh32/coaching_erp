import { Module } from '@nestjs/common';
import { BatchesService } from './batches.service';
import { BatchesController } from './batches.controller';
import { ErpnextModule } from '../../adapters/erpnext/erpnext.module';

@Module({
  imports: [ErpnextModule],
  controllers: [BatchesController],
  providers: [BatchesService],
})
export class BatchesModule {}
