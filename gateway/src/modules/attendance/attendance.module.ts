import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { AttendanceGateway } from './attendance.gateway';
import { ErpnextModule } from '../../adapters/erpnext/erpnext.module';
import { AuthModule } from '../auth/auth.module';
import { TenantScopeModule } from '../../shared/tenant/tenant-scope.module';
import { FeaturesModule } from '../../shared/feature-flags/features.module';
import { RfidCard } from '../../shared/entities/rfid-card.entity';
import { RfidWebhookGuard } from './guards/rfid-webhook.guard';

@Module({
  imports: [
    ErpnextModule,
    AuthModule,
    TenantScopeModule,
    FeaturesModule,
    TypeOrmModule.forFeature([RfidCard]),
  ],
  controllers: [AttendanceController],
  providers: [AttendanceService, AttendanceGateway, RfidWebhookGuard],
})
export class AttendanceModule {}
