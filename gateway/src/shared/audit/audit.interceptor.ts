import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuditLogService } from './audit-log.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly auditLogService: AuditLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;
    const path = req.route?.path || req.url;
    const user = req.user;
    const userId = user?.userId || 'anonymous';
    const instituteId = user?.tenantId || null;
    const start = Date.now();

    const logRequest = (status: string, error?: string) => {
      const entry = {
        event_type: 'audit_log',
        action: method,
        resource: path,
        user_id: userId,
        institute_id: instituteId,
        status,
        error,
        duration_ms: Date.now() - start,
      };
      this.auditLogService.append(entry);
      this.logger.log(JSON.stringify({ ...entry, timestamp: new Date().toISOString() }));
    };

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle().pipe(
        tap(() => logRequest('success')),
        catchError((err) => {
          logRequest('error', err?.message);
          return throwError(() => err);
        }),
      );
    }

    return next.handle().pipe(
      tap(() => {
        if (path?.includes('superadmin') || path?.includes('proxy')) {
          logRequest('success');
        }
      }),
    );
  }
}
