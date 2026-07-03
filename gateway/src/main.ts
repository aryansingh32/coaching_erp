import './tracing';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AuditInterceptor } from './shared/audit/audit.interceptor';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api/v1');
  app.use(helmet());

  const corsOrigins = configService.get<string>('CORS_ORIGINS');
  if (corsOrigins) {
    app.enableCors({
      origin: corsOrigins.split(',').map((o) => o.trim()),
      credentials: true,
    });
  } else if (configService.get<string>('NODE_ENV') === 'development') {
    app.enableCors({ origin: true, credentials: true });
  } else {
    Logger.warn('CORS_ORIGINS not set — cross-origin requests are disabled in production');
    app.enableCors({ origin: false });
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.useGlobalInterceptors(new TransformInterceptor(), app.get(AuditInterceptor));

  const enableSwagger =
    configService.get<string>('ENABLE_SWAGGER') === 'true' ||
    configService.get<string>('NODE_ENV') === 'development';

  if (enableSwagger) {
    const config = new DocumentBuilder()
      .setTitle('CoachingOS API')
      .setDescription('CoachingOS Gateway API Documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  app.enableShutdownHooks();

  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(`Application is running on: http://localhost:${port}/api/v1`);
}
bootstrap();
