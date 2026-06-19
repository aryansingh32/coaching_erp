import { Controller, Get, Param, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard/:id')
  @ApiOperation({ summary: 'Get Embedded Dashboard URL' })
  getDashboard(
    @Param('id') id: number,
    @Query('tenantId') tenantId: string
  ) {
    // In reality, get tenantId from req.user
    return this.analyticsService.getDashboardUrl(id, tenantId || 'default');
  }

  @Get('kpis')
  @ApiOperation({ summary: 'Get KPIs' })
  getKpis(@Query('tenantId') tenantId: string) {
    return this.analyticsService.getKpis(tenantId || 'default');
  }
}
