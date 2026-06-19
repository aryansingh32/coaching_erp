import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MetabaseAdapter } from '../../adapters/metabase/metabase.adapter';
import { EducationAdapter } from '../../adapters/erpnext/education.adapter';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly metabaseAdapter: MetabaseAdapter,
    private readonly erpAdapter: EducationAdapter,
    private readonly configService: ConfigService,
  ) {}

  getDashboardUrl(dashboardId: number, tenantId: string) {
    const id = dashboardId || this.configService.get<number>('METABASE_DASHBOARD_ID') || 1;
    return { url: this.metabaseAdapter.generateEmbedToken(id, tenantId), dashboardId: id };
  }

  async getKpis(tenantId: string) {
    try {
      const company = await this.erpAdapter.getInstituteCompany(tenantId);
      const students = await this.erpAdapter.listStudents(company);
      const batches = await this.erpAdapter.listDocs('Student Group', [['company', '=', company]]);
      return {
        totalStudents: students?.length || 0,
        activeBatches: batches?.length || 0,
        revenueMonthly: 0,
        attendanceToday: 0,
      };
    } catch (e) {
      this.logger.warn(`KPI fetch failed: ${e}`);
      return { totalStudents: 0, activeBatches: 0, revenueMonthly: 0, attendanceToday: 0 };
    }
  }
}
