import { ForbiddenException } from '@nestjs/common';
import { TenantScopeService } from './tenant-scope.service';
import { ProxyService } from '../../modules/proxy/proxy.service';
import { EducationAdapter } from '../../adapters/erpnext/education.adapter';
import { MoodleAdapter } from '../../adapters/moodle/moodle.adapter';
import { Repository } from 'typeorm';
import { Institute } from '../entities/institute.entity';
import { AuthenticatedUser } from './tenant.types';

/**
 * Integration-style test: tenant A admin cannot read tenant B ERP data via proxy.
 */
describe('Cross-tenant isolation', () => {
  let tenantScope: TenantScopeService;
  let proxyService: ProxyService;
  let erpAdapter: jest.Mocked<EducationAdapter>;

  const tenantAAdmin: AuthenticatedUser = {
    userId: 'admin-a',
    role: 'admin',
    tenantId: 'tenant-a',
  };

  beforeEach(() => {
    erpAdapter = {
      listDocs: jest.fn(),
      getDoc: jest.fn(),
      createDoc: jest.fn(),
      updateDoc: jest.fn(),
      callMethod: jest.fn(),
      getInstituteCompany: jest.fn(),
    } as unknown as jest.Mocked<EducationAdapter>;

    const instituteRepo = {
      findOne: jest.fn(async ({ where }: { where: { id: string } }) => {
        if (where.id === 'tenant-a') {
          return { id: 'tenant-a', erp_company: 'Company A' } as Institute;
        }
        if (where.id === 'tenant-b') {
          return { id: 'tenant-b', erp_company: 'Company B' } as Institute;
        }
        return null;
      }),
    } as unknown as Repository<Institute>;

    tenantScope = new TenantScopeService(erpAdapter, instituteRepo);
    proxyService = new ProxyService(
      erpAdapter,
      {} as MoodleAdapter,
      tenantScope,
    );
  });

  it('proxy list always injects tenant A company filter, stripping cross-tenant client filter', async () => {
    erpAdapter.listDocs.mockResolvedValue([{ name: 'STU-A1', company: 'Company A' }]);

    await proxyService.erpList(
      tenantAAdmin,
      'Student',
      JSON.stringify([['company', '=', 'Company B']]),
    );

    expect(erpAdapter.listDocs).toHaveBeenCalledWith(
      'Student',
      [['company', '=', 'Company A']],
      ['*'],
    );
  });

  it('proxy get rejects student belonging to another tenant', async () => {
    erpAdapter.getDoc.mockResolvedValue({ name: 'STU-B1', company: 'Company B' });

    await expect(
      proxyService.erpGet(tenantAAdmin, 'Student', 'STU-B1'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('proxy create injects caller company into payload', async () => {
    erpAdapter.createDoc.mockResolvedValue({ name: 'STU-NEW', company: 'Company A' });

    await proxyService.erpCreate(tenantAAdmin, 'Student', {
      first_name: 'Test',
      company: 'Company B',
    });

    expect(erpAdapter.createDoc).toHaveBeenCalledWith('Student', {
      first_name: 'Test',
      company: 'Company A',
    });
  });

  it('tenant A JWT cannot resolve tenant B via resolveTenantId', () => {
    expect(tenantScope.resolveTenantId(tenantAAdmin, 'tenant-b')).toBe('tenant-a');
  });
});
