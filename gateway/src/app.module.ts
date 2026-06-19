import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import * as Joi from 'joi';

import { ErpnextModule } from './adapters/erpnext/erpnext.module';
import { MoodleModule } from './adapters/moodle/moodle.module';
import { BbbModule } from './adapters/bbb/bbb.module';
import { MetabaseModule } from './adapters/metabase/metabase.module';

import { AuthModule } from './modules/auth/auth.module';
import { StudentsModule } from './modules/students/students.module';
import { BatchesModule } from './modules/batches/batches.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { FeesModule } from './modules/fees/fees.module';
import { HealthModule } from './modules/health/health.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { LiveClassModule } from './modules/live-class/live-class.module';
import { TestsModule } from './modules/tests/tests.module';
import { LmsModule } from './modules/lms/lms.module';
import { EducationPortalModule } from './modules/education-portal/education-portal.module';
import { ProxyModule } from './modules/proxy/proxy.module';
import { SuperadminModule } from './modules/superadmin/superadmin.module';
import { AuditModule } from './shared/audit/audit.module';
import { FeaturesModule } from './shared/feature-flags/features.module';
import {
  Institute,
  RfidCard,
  JwtRefreshToken,
  EventOutbox,
  QuestionBank,
  TestAttempt,
  LiveMeeting,
} from './shared/entities';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
        PORT: Joi.number().default(3000),
        ERPNEXT_URL: Joi.string().required(),
        ERPNEXT_API_KEY: Joi.string().allow('').required(),
        ERPNEXT_API_SECRET: Joi.string().allow('').required(),
        ERPNEXT_DEFAULT_COMPANY: Joi.string().required(),
        MOODLE_URL: Joi.string().required(),
        MOODLE_ADMIN_TOKEN: Joi.string().allow('').required(),
        BBB_URL: Joi.string().required(),
        BBB_SECRET: Joi.string().allow('').required(),
        METABASE_URL: Joi.string().required(),
        METABASE_SECRET_KEY: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        SUPER_ADMIN_PHONES: Joi.string().optional(),
        OTP_DEV_CODE: Joi.string().optional(),
        METABASE_DASHBOARD_ID: Joi.number().optional(),
        NOVU_APP_ID: Joi.string().optional(),
        RAZORPAY_KEY_ID: Joi.string().optional(),
        RAZORPAY_KEY_SECRET: Joi.string().optional(),
        RAZORPAY_WEBHOOK_SECRET: Joi.string().optional(),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().default(5432),
        DB_USER: Joi.string().required(),
        DB_PASS: Joi.string().required(),
        DB_NAME: Joi.string().required(),
        DB_SYNCHRONIZE: Joi.string().optional(),
        RUN_MIGRATIONS: Joi.string().optional(),
        DEFAULT_TENANT_ID: Joi.string().optional(),
      }),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASS'),
        database: configService.get<string>('DB_NAME'),
        entities: [
          Institute,
          RfidCard,
          JwtRefreshToken,
          EventOutbox,
          QuestionBank,
          TestAttempt,
          LiveMeeting,
        ],
        autoLoadEntities: true,
        synchronize:
          configService.get<string>('DB_SYNCHRONIZE') === 'true' ||
          (configService.get<string>('NODE_ENV') === 'development' &&
            configService.get<string>('DB_SYNCHRONIZE') !== 'false'),
        migrations: [join(__dirname, 'database', 'migrations', '*.{js,ts}')],
        migrationsRun: configService.get<string>('RUN_MIGRATIONS') === 'true',
      }),
      inject: [ConfigService],
    }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => [
        {
          name: 'short',
          ttl: 1000,
          limit: 3,
        },
        {
          name: 'medium',
          ttl: 10000,
          limit: 20,
        }
      ],
      inject: [ConfigService],
    }),
    ErpnextModule,
    MoodleModule,
    BbbModule,
    MetabaseModule,
    AuthModule,
    StudentsModule,
    BatchesModule,
    AttendanceModule,
    FeesModule,
    HealthModule,
    TenantsModule,
    AnalyticsModule,
    LiveClassModule,
    TestsModule,
    LmsModule,
    EducationPortalModule,
    ProxyModule,
    SuperadminModule,
    AuditModule,
    FeaturesModule,
  ],
})
export class AppModule {}
