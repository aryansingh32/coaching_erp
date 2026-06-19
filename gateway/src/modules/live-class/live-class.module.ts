import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LiveClassController } from './live-class.controller';
import { LiveClassService } from './live-class.service';
import { BbbModule } from '../../adapters/bbb/bbb.module';
import { AuthModule } from '../auth/auth.module';
import { LiveMeeting } from '../../shared/entities/live-meeting.entity';

@Module({
  imports: [BbbModule, AuthModule, TypeOrmModule.forFeature([LiveMeeting])],
  controllers: [LiveClassController],
  providers: [LiveClassService],
  exports: [LiveClassService],
})
export class LiveClassModule {}
