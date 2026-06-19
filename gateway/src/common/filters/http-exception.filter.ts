import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = 
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse = 
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const message = 
      typeof errorResponse === 'object' && errorResponse !== null && 'message' in errorResponse
        ? (errorResponse as any).message
        : errorResponse;

    response.status(status).json({
      success: false,
      statusCode: status,
      message: Array.isArray(message) ? message[0] : message,
      error: typeof errorResponse === 'object' && errorResponse !== null && 'error' in errorResponse ? (errorResponse as any).error : undefined,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
