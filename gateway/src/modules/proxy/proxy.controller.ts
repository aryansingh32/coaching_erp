import {
  Controller, Get, Post, Put, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProxyService } from './proxy.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Proxy')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('proxy')
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  @Get('erp/:doctype')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'List ERPNext documents (admin passthrough)' })
  erpList(
    @Param('doctype') doctype: string,
    @Query('filters') filters?: string,
    @Query('fields') fields?: string,
  ) {
    return this.proxyService.erpList(doctype, filters, fields);
  }

  @Get('erp/:doctype/:name')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Get ERPNext document' })
  erpGet(@Param('doctype') doctype: string, @Param('name') name: string) {
    return this.proxyService.erpGet(doctype, name);
  }

  @Post('erp/:doctype')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Create ERPNext document' })
  erpCreate(@Param('doctype') doctype: string, @Body() body: Record<string, unknown>) {
    return this.proxyService.erpCreate(doctype, body);
  }

  @Put('erp/:doctype/:name')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Update ERPNext document' })
  erpUpdate(
    @Param('doctype') doctype: string,
    @Param('name') name: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.proxyService.erpUpdate(doctype, name, body);
  }

  @Post('erp/method')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Call ERPNext whitelisted method' })
  erpMethod(@Body() body: { method: string; data?: Record<string, unknown> }) {
    return this.proxyService.erpCallMethod(body.method, body.data || {});
  }

  @Post('moodle/call')
  @Roles('admin', 'super_admin', 'instructor')
  @ApiOperation({ summary: 'Call Moodle Web Service function' })
  moodleCall(@Body() body: { wsFunction: string; params?: Record<string, unknown> }) {
    return this.proxyService.moodleCall(body.wsFunction, body.params || {});
  }
}
