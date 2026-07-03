import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EducationAdapter } from '../../adapters/erpnext/education.adapter';
import { Institute } from '../entities/institute.entity';
import { AuthenticatedUser } from './tenant.types';

/** ERPNext doctypes isolated by the `company` field. */
export const COMPANY_SCOPED_DOCTYPES = new Set([
  'Student',
  'Student Group',
  'Student Group Student',
  'Instructor',
  'Student Leave Application',
  'Course',
  'Program',
  'Program Enrollment',
  'Assessment Plan',
  'Assessment Result',
  'Fee Structure',
  'Student Attendance',
  'Student Admission',
  'Guardian',
]);

@Injectable()
export class TenantScopeService {
  constructor(
    private readonly erpAdapter: EducationAdapter,
    @InjectRepository(Institute)
    private readonly instituteRepo: Repository<Institute>,
  ) {}

  isSuperAdmin(user: AuthenticatedUser): boolean {
    return user.role === 'super_admin';
  }

  /** Super admin may pass an explicit tenant; everyone else uses JWT tenant only. */
  resolveTenantId(user: AuthenticatedUser, queryTenantId?: string): string {
    if (this.isSuperAdmin(user)) {
      if (queryTenantId) return queryTenantId;
      if (user.tenantId) return user.tenantId;
      throw new BadRequestException('tenantId query parameter required for super admin');
    }
    if (!user.tenantId) {
      throw new ForbiddenException('Tenant context missing from token');
    }
    return user.tenantId;
  }

  async getCompanyForTenant(tenantId: string): Promise<string> {
    const institute = await this.instituteRepo.findOne({ where: { id: tenantId } });
    if (institute?.erp_company) {
      return institute.erp_company;
    }
    return this.erpAdapter.getInstituteCompany(tenantId);
  }

  async getInstitute(tenantId: string): Promise<Institute> {
    const institute = await this.instituteRepo.findOne({ where: { id: tenantId } });
    if (!institute) {
      throw new NotFoundException('Institute not found');
    }
    return institute;
  }

  async getMoodleCategoryId(tenantId: string): Promise<string> {
    const institute = await this.getInstitute(tenantId);
    if (!institute.moodle_category_id) {
      throw new ForbiddenException('Moodle category is not configured for this institute');
    }
    return institute.moodle_category_id;
  }

  /** Strip client company filters and enforce the caller's company. */
  mergeCompanyFilters(
    clientFilters: unknown[] | undefined,
    company: string,
  ): [string, string, string][] {
    const base: [string, string, string] = ['company', '=', company];
    if (!Array.isArray(clientFilters) || clientFilters.length === 0) {
      return [base];
    }
    const withoutCompany = clientFilters.filter(
      (f) => !Array.isArray(f) || f[0] !== 'company',
    ) as [string, string, string][];
    return [...withoutCompany, base];
  }

  injectCompanyIntoData(
    data: Record<string, unknown>,
    company: string,
    doctype: string,
  ): Record<string, unknown> {
    if (!COMPANY_SCOPED_DOCTYPES.has(doctype)) {
      return data;
    }
    return { ...data, company };
  }

  assertDocBelongsToCompany(doc: Record<string, unknown>, company: string, doctype: string): void {
    if (!COMPANY_SCOPED_DOCTYPES.has(doctype)) {
      return;
    }
    if (doc.company && doc.company !== company) {
      throw new ForbiddenException('Document does not belong to your institute');
    }
  }

  async assertBatchBelongsToTenant(batchId: string, tenantId: string): Promise<void> {
    const company = await this.getCompanyForTenant(tenantId);
    const batch = await this.erpAdapter.getDoc('Student Group', batchId);
    this.assertDocBelongsToCompany(batch, company, 'Student Group');
  }

  async assertStudentBelongsToTenant(studentId: string, tenantId: string): Promise<void> {
    const company = await this.getCompanyForTenant(tenantId);
    const student = await this.erpAdapter.getDoc('Student', studentId);
    this.assertDocBelongsToCompany(student, company, 'Student');
  }
}
