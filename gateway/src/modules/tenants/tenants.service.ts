import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Institute } from '../../shared/entities/institute.entity';
import { FeaturesService } from '../../shared/feature-flags/features.service';

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(
    @InjectRepository(Institute) private readonly instituteRepo: Repository<Institute>,
    private readonly featuresService: FeaturesService,
  ) {}

  async createTenant(data: { name: string; slug?: string; plan?: string; branding?: Record<string, unknown> }) {
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50);
    const tenant = this.instituteRepo.create({
      name: data.name,
      slug,
      plan: data.plan || 'starter',
      branding: data.branding || {},
      features: {},
      integrations: {},
      erp_company: data.name,
    });
    const saved = await this.instituteRepo.save(tenant);
    this.logger.log(`Provisioned tenant: ${saved.id}`);
    return { ...saved, status: 'active' };
  }

  async getTenants() {
    const tenants = await this.instituteRepo.find({ order: { created_at: 'DESC' } });
    return tenants.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      plan: t.plan,
      status: t.plan === 'suspended' ? 'suspended' : 'active',
      branding: t.branding,
      created_at: t.created_at,
    }));
  }

  async getTenantById(id: string) {
    const tenant = await this.instituteRepo.findOne({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    const features = await this.featuresService.getTenantFeatures(id);
    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      plan: tenant.plan,
      status: tenant.plan === 'suspended' ? 'suspended' : 'active',
      branding: tenant.branding,
      subdomain: tenant.slug,
      features,
      integrations: {
        razorpay_enabled: tenant.integrations?.razorpay_enabled || false,
        razorpay_key_id: tenant.integrations?.razorpay_key_id || null,
      },
    };
  }

  async getTenantFeatures(id: string) {
    return this.featuresService.getTenantFeatures(id);
  }

  async updateTenant(id: string, data: Record<string, unknown>) {
    const tenant = await this.instituteRepo.findOne({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    if (data.name) tenant.name = data.name as string;
    if (data.branding) tenant.branding = data.branding as Record<string, unknown>;
    if (data.plan) tenant.plan = data.plan as string;
    const saved = await this.instituteRepo.save(tenant);
    const features = await this.featuresService.getTenantFeatures(id);
    return { id: saved.id, name: saved.name, branding: saved.branding, status: 'active', features };
  }

  async disableTenant(id: string) {
    await this.instituteRepo.update(id, { plan: 'suspended' });
    return { id, status: 'disabled' };
  }
}
