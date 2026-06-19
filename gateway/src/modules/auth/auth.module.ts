import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { ErpnextModule } from '../../adapters/erpnext/erpnext.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Institute } from '../../shared/entities/institute.entity';

@Module({
  imports: [
    PassportModule,
    CacheModule.register(),
    TypeOrmModule.forFeature([Institute]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' }, // Short lived access token
      }),
      inject: [ConfigService],
    }),
    ErpnextModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, RolesGuard],
  exports: [AuthService, JwtModule, JwtAuthGuard, RolesGuard, PassportModule],
})
export class AuthModule {}
