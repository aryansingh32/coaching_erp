import { Controller, Post, Get, Put, Delete, Body, Param } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Tenants')
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @ApiOperation({ summary: 'Create Tenant' })
  async create(@Body() body: any) {
    return this.tenantsService.createTenant(body);
  }

  @Get()
  @ApiOperation({ summary: 'List Tenants' })
  async list() {
    return this.tenantsService.getTenants();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Tenant' })
  async getOne(@Param('id') id: string) {
    return this.tenantsService.getTenantById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update Tenant' })
  async update(@Param('id') id: string, @Body() body: any) {
    return this.tenantsService.updateTenant(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Disable Tenant' })
  async disable(@Param('id') id: string) {
    return this.tenantsService.disableTenant(id);
  }
}
