import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Institute } from '../entities/institute.entity';
import { FEATURE_CATALOG, PLAN_FEATURES } from './feature-catalog';

@Injectable()
export class FeaturesService {
  constructor(
    @InjectRepository(Institute) private readonly instituteRepo: Repository<Institute>,
  ) {}

  getCatalog() {
    return FEATURE_CATALOG;
  }

  resolveForPlan(plan: string, overrides?: Record<string, boolean> | null): Record<string, boolean> {
    const baseKeys = PLAN_FEATURES[plan] || PLAN_FEATURES.starter;
    const resolved: Record<string, boolean> = {};

    for (const feature of FEATURE_CATALOG) {
      const planDefault = baseKeys.includes(feature.key);
      resolved[feature.key] = overrides && feature.key in overrides
        ? overrides[feature.key]
        : planDefault;
    }
    return resolved;
  }

  async getTenantFeatures(tenantId: string): Promise<Record<string, boolean>> {
    const tenant = await this.instituteRepo.findOne({ where: { id: tenantId } });
    if (!tenant) {
      return this.resolveForPlan('starter');
    }
    return this.resolveForPlan(tenant.plan, tenant.features);
  }

  async isEnabled(tenantId: string, featureKey: string): Promise<boolean> {
    const features = await this.getTenantFeatures(tenantId);
    return features[featureKey] === true;
  }

  async updateTenantFeatures(tenantId: string, updates: Record<string, boolean>) {
    const tenant = await this.instituteRepo.findOne({ where: { id: tenantId } });
    if (!tenant) throw new Error('Tenant not found');
    tenant.features = { ...(tenant.features || {}), ...updates };
    await this.instituteRepo.save(tenant);
    return this.resolveForPlan(tenant.plan, tenant.features);
  }
}
