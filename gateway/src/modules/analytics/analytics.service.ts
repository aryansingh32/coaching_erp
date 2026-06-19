import { Injectable, Logger } from '@nestjs/common';
import { MetabaseAdapter } from '../../adapters/metabase/metabase.adapter';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly metabaseAdapter: MetabaseAdapter) {}

  getDashboardUrl(dashboardId: number, tenantId: string) {
    return { url: this.metabaseAdapter.generateEmbedToken(dashboardId, tenantId) };
  }

  async getKpis(tenantId: string) {
    return {
      totalStudents: 150,
      activeBatches: 5,
      revenueMonthly: 500000
    };
  }
}
