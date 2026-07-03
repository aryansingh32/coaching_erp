import {
  Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProxyService } from './proxy.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { FeatureGuard, RequireFeature } from '../../shared/feature-flags/features';
import { MoodleProxyFeatureGuard } from './guards/moodle-proxy-feature.guard';
import { AuthenticatedUser } from '../../shared/tenant/tenant.types';

@ApiTags('Proxy')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('proxy')
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  @Get('erp/:doctype')
  @UseGuards(FeatureGuard)
  @RequireFeature('api_proxy')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'List ERPNext documents (tenant-scoped for institute admins)' })
  erpList(
    @Request() req: { user: AuthenticatedUser },
    @Param('doctype') doctype: string,
    @Query('filters') filters?: string,
    @Query('fields') fields?: string,
  ) {
    return this.proxyService.erpList(req.user, doctype, filters, fields);
  }

  @Get('erp/:doctype/:name')
  @UseGuards(FeatureGuard)
  @RequireFeature('api_proxy')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Get ERPNext document (tenant-scoped for institute admins)' })
  erpGet(
    @Request() req: { user: AuthenticatedUser },
    @Param('doctype') doctype: string,
    @Param('name') name: string,
  ) {
    return this.proxyService.erpGet(req.user, doctype, name);
  }

  @Post('erp/:doctype')
  @UseGuards(FeatureGuard)
  @RequireFeature('api_proxy')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Create ERPNext document (tenant-scoped for institute admins)' })
  erpCreate(
    @Request() req: { user: AuthenticatedUser },
    @Param('doctype') doctype: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.proxyService.erpCreate(req.user, doctype, body);
  }

  @Put('erp/:doctype/:name')
  @UseGuards(FeatureGuard)
  @RequireFeature('api_proxy')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Update ERPNext document (tenant-scoped for institute admins)' })
  erpUpdate(
    @Request() req: { user: AuthenticatedUser },
    @Param('doctype') doctype: string,
    @Param('name') name: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.proxyService.erpUpdate(req.user, doctype, name, body);
  }

  @Post('erp/method')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Call ERPNext whitelisted method (super admin only)' })
  erpMethod(
    @Request() req: { user: AuthenticatedUser },
    @Body() body: { method: string; data?: Record<string, unknown> },
  ) {
    return this.proxyService.erpCallMethod(req.user, body.method, body.data || {});
  }

  @Post('moodle/call')
  @UseGuards(MoodleProxyFeatureGuard)
  @Roles('admin', 'super_admin', 'instructor')
  @ApiOperation({ summary: 'Call Moodle Web Service function (tenant-scoped for institute users)' })
  moodleCall(
    @Request() req: { user: AuthenticatedUser },
    @Body() body: { wsFunction: string; params?: Record<string, unknown> },
  ) {
    return this.proxyService.moodleCall(req.user, body.wsFunction, body.params || {});
  }
}
