import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeesService } from './fees.service';
import { FeesController } from './fees.controller';
import { ErpnextModule } from '../../adapters/erpnext/erpnext.module';
import { RazorpayModule } from '../../adapters/razorpay/razorpay.module';
import { Institute } from '../../shared/entities/institute.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    ErpnextModule,
    RazorpayModule,
    AuthModule,
    CacheModule.register(),
    TypeOrmModule.forFeature([Institute]),
  ],
  controllers: [FeesController],
  providers: [FeesService],
})
export class FeesModule {}
