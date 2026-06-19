import { Injectable } from '@nestjs/common';

export interface AuditLogEntry {
  id: string;
  event_type: string;
  action: string;
  resource: string;
  user_id: string;
  institute_id: string | null;
  status: string;
  error?: string;
  duration_ms?: number;
  timestamp: string;
}

@Injectable()
export class AuditLogService {
  private readonly logs: AuditLogEntry[] = [];
  private readonly maxLogs = 10_000;

  append(entry: Omit<AuditLogEntry, 'id' | 'timestamp'> & { timestamp?: string }) {
    const record: AuditLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: entry.timestamp || new Date().toISOString(),
      ...entry,
    };
    this.logs.unshift(record);
    if (this.logs.length > this.maxLogs) {
      this.logs.length = this.maxLogs;
    }
    return record;
  }

  query(filters?: {
    instituteId?: string;
    userId?: string;
    action?: string;
    limit?: number;
    offset?: number;
  }) {
    let results = [...this.logs];
    if (filters?.instituteId) {
      results = results.filter((l) => l.institute_id === filters.instituteId);
    }
    if (filters?.userId) {
      results = results.filter((l) => l.user_id === filters.userId);
    }
    if (filters?.action) {
      results = results.filter((l) => l.action === filters.action);
    }
    const offset = filters?.offset ?? 0;
    const limit = filters?.limit ?? 100;
    return {
      total: results.length,
      items: results.slice(offset, offset + limit),
    };
  }

  getStats() {
    const last24h = Date.now() - 24 * 60 * 60 * 1000;
    const recent = this.logs.filter((l) => new Date(l.timestamp).getTime() > last24h);
    const errors = recent.filter((l) => l.status === 'error');
    const byInstitute: Record<string, number> = {};
    recent.forEach((l) => {
      const key = l.institute_id || 'platform';
      byInstitute[key] = (byInstitute[key] || 0) + 1;
    });
    return {
      totalLogs: this.logs.length,
      last24hRequests: recent.length,
      last24hErrors: errors.length,
      requestsByInstitute: byInstitute,
    };
  }
}
