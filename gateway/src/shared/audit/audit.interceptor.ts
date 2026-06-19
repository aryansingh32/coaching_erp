import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;

    // We only want to log write operations (POST, PUT, PATCH, DELETE)
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const user = req.user;
      const userId = user?.id || 'anonymous';
      const instituteId = user?.institute_id || null;
      const path = req.route?.path || req.url;

      // Log to be collected by some ClickHouse sink (e.g. Vector or FluentBit)
      // or directly inserted. For this implementation, we log structurally.
      return next.handle().pipe(
        tap(() => {
          this.logger.log(JSON.stringify({
            event_type: 'audit_log',
            action: method,
            resource: path,
            user_id: userId,
            institute_id: instituteId,
            status: 'success',
            timestamp: new Date().toISOString(),
          }));
        }),
      );
    }

    return next.handle();
  }
}
