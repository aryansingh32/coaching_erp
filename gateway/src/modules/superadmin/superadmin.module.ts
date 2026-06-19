import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuperadminController } from './superadmin.controller';
import { SuperadminService } from './superadmin.service';
import { Institute } from '../../shared/entities/institute.entity';
import { ErpnextModule } from '../../adapters/erpnext/erpnext.module';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../../shared/audit/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([Institute]), ErpnextModule, AuthModule, AuditModule],
  controllers: [SuperadminController],
  providers: [SuperadminService],
})
export class SuperadminModule {}
