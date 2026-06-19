import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  async createTenant(data: any) {
    this.logger.log(`Provisioning new tenant: ${data.name}`);
    return { id: `tenant-${Date.now()}`, name: data.name, status: 'provisioning' };
  }

  async getTenants() {
    return [{ id: 'tenant-1', name: 'Default Institute' }];
  }

  async getTenantById(id: string) {
    return { id, name: 'Default Institute' };
  }

  async updateTenant(id: string, data: any) {
    return { id, ...data };
  }

  async disableTenant(id: string) {
    return { id, status: 'disabled' };
  }
}
