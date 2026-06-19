import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { RazorpayAdapter } from './razorpay.adapter';

@Module({
  imports: [HttpModule],
  providers: [RazorpayAdapter],
  exports: [RazorpayAdapter],
})
export class RazorpayModule {}
