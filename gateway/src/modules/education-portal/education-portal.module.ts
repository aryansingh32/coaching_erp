import { Module } from '@nestjs/common';
import { EducationPortalController } from './education-portal.controller';
import { EducationPortalService } from './education-portal.service';
import { ErpnextModule } from '../../adapters/erpnext/erpnext.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ErpnextModule, AuthModule],
  controllers: [EducationPortalController],
  providers: [EducationPortalService],
})
export class EducationPortalModule {}
