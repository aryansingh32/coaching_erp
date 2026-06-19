import { Module } from '@nestjs/common';
import { BatchesService } from './batches.service';
import { BatchesController } from './batches.controller';
import { ErpnextModule } from '../../adapters/erpnext/erpnext.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ErpnextModule, AuthModule],
  controllers: [BatchesController],
  providers: [BatchesService],
})
export class BatchesModule {}
