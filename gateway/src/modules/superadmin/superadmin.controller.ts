import { Controller, Get, Post, Put, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SuperadminService } from './superadmin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Super Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin')
@Controller('superadmin')
export class SuperadminController {
  constructor(private readonly superadminService: SuperadminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Platform-wide statistics' })
  stats() {
    return this.superadminService.getPlatformStats();
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Query audit logs' })
  auditLogs(
    @Query('instituteId') instituteId?: string,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.superadminService.getAuditLogs({ instituteId, userId, action, limit, offset });
  }

  @Get('tenants/:id/metrics')
  @ApiOperation({ summary: 'Per-tenant metrics and activity' })
  tenantMetrics(@Param('id') id: string) {
    return this.superadminService.getTenantMetrics(id);
  }

  @Post('tenants/:id/suspend')
  @ApiOperation({ summary: 'Suspend tenant' })
  suspend(@Param('id') id: string) {
    return this.superadminService.suspendTenant(id);
  }

  @Get('features/catalog')
  @ApiOperation({ summary: 'List all platform features' })
  featureCatalog() {
    return this.superadminService.getFeatureCatalog();
  }

  @Get('tenants/:id/features')
  @ApiOperation({ summary: 'Get tenant feature flags' })
  tenantFeatures(@Param('id') id: string) {
    return this.superadminService.getTenantFeatures(id);
  }

  @Put('tenants/:id/features')
  @ApiOperation({ summary: 'Update tenant feature flags' })
  updateTenantFeatures(
    @Param('id') id: string,
    @Body() body: { features: Record<string, boolean> },
  ) {
    return this.superadminService.updateTenantFeatures(id, body.features);
  }
}
