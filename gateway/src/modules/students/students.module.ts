import { Module } from '@nestjs/common';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';
import { ErpnextModule } from '../../adapters/erpnext/erpnext.module';
import { AuthModule } from '../auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RfidCard } from '../../shared/entities/rfid-card.entity';
import { TenantScopeModule } from '../../shared/tenant/tenant-scope.module';
import { FeaturesModule } from '../../shared/feature-flags/features.module';

@Module({
  imports: [ErpnextModule, AuthModule, TenantScopeModule, FeaturesModule, TypeOrmModule.forFeature([RfidCard])],
  controllers: [StudentsController],
  providers: [StudentsService],
  exports: [StudentsService],
})
export class StudentsModule {}
