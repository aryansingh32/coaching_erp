// Tracing must be imported first
import './tracing';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
// Audit Interceptor, Transform Interceptor, and Global Exception Filter are assumed 
// to be imported here if they exist, standard practice or standard boilerplate
// For this snippet, we use standard generic placeholders or built-in alternatives if they are not generated

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Set global prefix 'api/v1' (from v3 Flaw B)
  app.setGlobalPrefix('api/v1');
  
  // Enable CORS
  app.enableCors();
  
  // Enable validation pipe globally
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));
  
  // Apply global exception filter
  // app.useGlobalFilters(new GlobalExceptionFilter()); // Assuming it exists
  
  // Apply global transform interceptor
  // app.useGlobalInterceptors(new TransformInterceptor()); // Assuming it exists
  
  // Apply audit interceptor
  // app.useGlobalInterceptors(new AuditInterceptor()); // Assuming it exists
  
  // Set up Redis IO adapter for Socket.io (from v3 Flaw C)
  // const redisIoAdapter = new RedisIoAdapter(app);
  // await redisIoAdapter.connectToRedis();
  // app.useWebSocketAdapter(redisIoAdapter);
  
  // Enable Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('CoachingOS API')
    .setDescription('CoachingOS Gateway API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  
  // Graceful shutdown hooks
  app.enableShutdownHooks();
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(`🚀 Application is running on: http://localhost:${port}/api/v1`);
}
bootstrap();
