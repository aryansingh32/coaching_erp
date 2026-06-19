import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Institute } from '../../shared/entities/institute.entity';
import { EducationAdapter } from '../../adapters/erpnext/education.adapter';
import { AuditLogService } from '../../shared/audit/audit-log.service';
import { FeaturesService } from '../../shared/feature-flags/features.service';

@Injectable()
export class SuperadminService {
  constructor(
    @InjectRepository(Institute) private readonly instituteRepo: Repository<Institute>,
    private readonly erpAdapter: EducationAdapter,
    private readonly auditLogService: AuditLogService,
    private readonly featuresService: FeaturesService,
  ) {}

  getFeatureCatalog() {
    return this.featuresService.getCatalog();
  }

  async getTenantFeatures(tenantId: string) {
    const tenant = await this.instituteRepo.findOne({ where: { id: tenantId } });
    if (!tenant) return { error: 'Tenant not found' };
    const resolved = await this.featuresService.getTenantFeatures(tenantId);
    return {
      tenantId,
      plan: tenant.plan,
      overrides: tenant.features || {},
      resolved,
    };
  }

  async updateTenantFeatures(tenantId: string, features: Record<string, boolean>) {
    const resolved = await this.featuresService.updateTenantFeatures(tenantId, features);
    return { tenantId, resolved };
  }

  async getPlatformStats() {
    const tenants = await this.instituteRepo.find();
    let totalStudents = 0;
    let totalBatches = 0;
    try {
      const students = await this.erpAdapter.listDocs('Student');
      const batches = await this.erpAdapter.listDocs('Student Group');
      totalStudents = students?.length || 0;
      totalBatches = batches?.length || 0;
    } catch {
      // ERP may be offline
    }
    const auditStats = this.auditLogService.getStats();
    return {
      tenantCount: tenants.length,
      totalStudents,
      totalBatches,
      ...auditStats,
    };
  }

  getAuditLogs(filters?: {
    instituteId?: string;
    userId?: string;
    action?: string;
    limit?: number;
    offset?: number;
  }) {
    return this.auditLogService.query(filters);
  }

  async getTenantMetrics(tenantId: string) {
    const tenant = await this.instituteRepo.findOne({ where: { id: tenantId } });
    if (!tenant) return { id: tenantId, error: 'Tenant not found' };
    const company = tenant.erp_company || await this.erpAdapter.getInstituteCompany(tenantId);
    let students = 0;
    let batches = 0;
    try {
      const studentList = await this.erpAdapter.listStudents(company);
      const batchList = await this.erpAdapter.listDocs('Student Group', [['company', '=', company]]);
      students = studentList?.length || 0;
      batches = batchList?.length || 0;
    } catch {
      // ignore
    }
    const logs = this.auditLogService.query({ instituteId: tenantId, limit: 50 });
    const features = await this.featuresService.getTenantFeatures(tenantId);
    return { tenant, students, batches, recentActivity: logs.items, features };
  }

  async suspendTenant(tenantId: string) {
    await this.instituteRepo.update(tenantId, { plan: 'suspended' } as any);
    return { id: tenantId, status: 'suspended' };
  }
}
