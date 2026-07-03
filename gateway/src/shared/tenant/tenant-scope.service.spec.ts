import { ForbiddenException } from '@nestjs/common';
import { TenantScopeService } from './tenant-scope.service';
import { EducationAdapter } from '../../adapters/erpnext/education.adapter';
import { Repository } from 'typeorm';
import { Institute } from '../entities/institute.entity';
import { AuthenticatedUser } from './tenant.types';

describe('TenantScopeService', () => {
  let service: TenantScopeService;
  let erpAdapter: jest.Mocked<Pick<EducationAdapter, 'getInstituteCompany' | 'getDoc'>>;
  let instituteRepo: jest.Mocked<Pick<Repository<Institute>, 'findOne'>>;

  beforeEach(() => {
    erpAdapter = {
      getInstituteCompany: jest.fn().mockResolvedValue('Company A'),
      getDoc: jest.fn(),
    };
    instituteRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 'tenant-a', erp_company: 'Company A' } as Institute),
    };
    service = new TenantScopeService(
      erpAdapter as unknown as EducationAdapter,
      instituteRepo as unknown as Repository<Institute>,
    );
  });

  describe('resolveTenantId', () => {
    const admin: AuthenticatedUser = { userId: 'u1', role: 'admin', tenantId: 'tenant-a' };
    const superAdmin: AuthenticatedUser = { userId: 'sa', role: 'super_admin' };

    it('uses JWT tenant for institute admin and ignores query override', () => {
      expect(service.resolveTenantId(admin, 'tenant-b')).toBe('tenant-a');
    });

    it('allows super admin to specify tenant via query', () => {
      expect(service.resolveTenantId(superAdmin, 'tenant-b')).toBe('tenant-b');
    });

    it('rejects institute admin without tenantId', () => {
      expect(() =>
        service.resolveTenantId({ userId: 'u1', role: 'admin' }),
      ).toThrow(ForbiddenException);
    });
  });

  describe('mergeCompanyFilters', () => {
    it('injects company filter when none provided', () => {
      expect(service.mergeCompanyFilters(undefined, 'Co A')).toEqual([
        ['company', '=', 'Co A'],
      ]);
    });

    it('strips client company filter and enforces server company', () => {
      const merged = service.mergeCompanyFilters(
        [['company', '=', 'Evil Co'], ['status', '=', 'Active']],
        'Co A',
      );
      expect(merged).toEqual([
        ['status', '=', 'Active'],
        ['company', '=', 'Co A'],
      ]);
    });
  });

  describe('assertDocBelongsToCompany', () => {
    it('throws when document company mismatches', () => {
      expect(() =>
        service.assertDocBelongsToCompany({ company: 'Co B' }, 'Co A', 'Student'),
      ).toThrow(ForbiddenException);
    });

    it('passes when company matches', () => {
      expect(() =>
        service.assertDocBelongsToCompany({ company: 'Co A' }, 'Co A', 'Student'),
      ).not.toThrow();
    });
  });

  describe('getCompanyForTenant', () => {
    it('prefers institute.erp_company over ERP lookup', async () => {
      const company = await service.getCompanyForTenant('tenant-a');
      expect(company).toBe('Company A');
      expect(erpAdapter.getInstituteCompany).not.toHaveBeenCalled();
    });

    it('falls back to ERP when erp_company not set', async () => {
      instituteRepo.findOne.mockResolvedValue({ id: 'tenant-a' } as Institute);
      const company = await service.getCompanyForTenant('tenant-a');
      expect(company).toBe('Company A');
      expect(erpAdapter.getInstituteCompany).toHaveBeenCalledWith('tenant-a');
    });
  });
});
