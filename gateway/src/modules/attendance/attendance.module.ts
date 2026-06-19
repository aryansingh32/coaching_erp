import { Module } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { AttendanceGateway } from './attendance.gateway';
import { ErpnextModule } from '../../adapters/erpnext/erpnext.module';

@Module({
  imports: [ErpnextModule],
  controllers: [AttendanceController],
  providers: [AttendanceService, AttendanceGateway],
})
export class AttendanceModule {}
