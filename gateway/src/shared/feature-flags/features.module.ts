import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Institute } from '../entities/institute.entity';
import { FeaturesService } from './features.service';
import { FeatureGuard } from './features';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Institute])],
  providers: [FeaturesService, FeatureGuard],
  exports: [FeaturesService, FeatureGuard],
})
export class FeaturesModule {}
