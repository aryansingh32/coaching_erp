import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantScopeService } from './tenant-scope.service';
import { Institute } from '../entities/institute.entity';
import { ErpnextModule } from '../../adapters/erpnext/erpnext.module';

@Module({
  imports: [TypeOrmModule.forFeature([Institute]), ErpnextModule],
  providers: [TenantScopeService],
  exports: [TenantScopeService],
})
export class TenantScopeModule {}
