import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BbbAdapter } from './bbb.adapter';

@Module({
  imports: [HttpModule],
  providers: [BbbAdapter],
  exports: [BbbAdapter],
})
export class BbbModule {}
