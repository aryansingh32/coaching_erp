import { Controller, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { FeatureGuard, RequireFeature } from '../../shared/feature-flags/features';
import { TenantScopeService } from '../../shared/tenant/tenant-scope.service';
import { AuthenticatedUser } from '../../shared/tenant/tenant.types';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
@RequireFeature('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly tenantScope: TenantScopeService,
  ) {}

  @Get('dashboard/:id')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Get Embedded Dashboard URL' })
  getDashboard(
    @Request() req: { user: AuthenticatedUser },
    @Param('id') id: number,
    @Query('tenantId') tenantId?: string,
  ) {
    const resolved = this.tenantScope.resolveTenantId(req.user, tenantId);
    return this.analyticsService.getDashboardUrl(id, resolved);
  }

  @Get('kpis')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Get KPIs' })
  getKpis(
    @Request() req: { user: AuthenticatedUser },
    @Query('tenantId') tenantId?: string,
  ) {
    const resolved = this.tenantScope.resolveTenantId(req.user, tenantId);
    return this.analyticsService.getKpis(resolved);
  }
}
