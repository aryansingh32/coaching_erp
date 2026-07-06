import { Module } from '@nestjs/common';
import { MetabaseAdapter } from './metabase.adapter';

@Module({
  providers: [MetabaseAdapter],
  exports: [MetabaseAdapter],
})
export class MetabaseModule {}
