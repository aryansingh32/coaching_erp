import { ForbiddenException } from '@nestjs/common';
import { ProxyService } from './proxy.service';
import { EducationAdapter } from '../../adapters/erpnext/education.adapter';
import { MoodleAdapter } from '../../adapters/moodle/moodle.adapter';
import { TenantScopeService } from '../../shared/tenant/tenant-scope.service';
import { AuthenticatedUser } from '../../shared/tenant/tenant.types';

describe('ProxyService tenant isolation', () => {
  let service: ProxyService;
  let erpAdapter: jest.Mocked<Pick<EducationAdapter, 'listDocs' | 'getDoc' | 'createDoc' | 'updateDoc'>>;
  let moodleAdapter: jest.Mocked<Pick<MoodleAdapter, 'call'>>;
  let tenantScope: {
    isSuperAdmin: jest.Mock;
    getCompanyForTenant: jest.Mock;
    mergeCompanyFilters: jest.Mock;
    injectCompanyIntoData: jest.Mock;
    assertDocBelongsToCompany: jest.Mock;
    getInstitute: jest.Mock;
  };

  const admin: AuthenticatedUser = { userId: 'a1', role: 'admin', tenantId: 'tenant-a' };
  const superAdmin: AuthenticatedUser = { userId: 'sa', role: 'super_admin' };

  beforeEach(() => {
    erpAdapter = {
      listDocs: jest.fn().mockResolvedValue([{ name: 'STU-1', company: 'Co A' }]),
      getDoc: jest.fn().mockResolvedValue({ name: 'STU-1', company: 'Co A' }),
      createDoc: jest.fn().mockResolvedValue({ name: 'STU-NEW' }),
      updateDoc: jest.fn().mockResolvedValue({ name: 'STU-1' }),
    };
    moodleAdapter = { call: jest.fn().mockResolvedValue([]) };
    tenantScope = {
      isSuperAdmin: jest.fn((u) => u.role === 'super_admin'),
      getCompanyForTenant: jest.fn().mockResolvedValue('Co A'),
      mergeCompanyFilters: jest.fn((filters, company) => [
        ...(filters || []),
        ['company', '=', company],
      ]),
      injectCompanyIntoData: jest.fn((data, company) => ({ ...data, company })),
      assertDocBelongsToCompany: jest.fn(),
      getInstitute: jest.fn().mockResolvedValue({ moodle_category_id: '42' }),
    };
    service = new ProxyService(
      erpAdapter as unknown as EducationAdapter,
      moodleAdapter as unknown as MoodleAdapter,
      tenantScope as unknown as TenantScopeService,
    );
  });

  it('merges company filter for institute admin ERP list', async () => {
    await service.erpList(admin, 'Student', JSON.stringify([['status', '=', 'Active']]));
    expect(tenantScope.mergeCompanyFilters).toHaveBeenCalledWith(
      [['status', '=', 'Active']],
      'Co A',
    );
    expect(erpAdapter.listDocs).toHaveBeenCalled();
  });

  it('does not merge company filter for super admin ERP list', async () => {
    await service.erpList(superAdmin, 'Student');
    expect(tenantScope.mergeCompanyFilters).not.toHaveBeenCalled();
    expect(erpAdapter.listDocs).toHaveBeenCalledWith('Student', undefined, ['*']);
  });

  it('verifies document company on ERP get for institute admin', async () => {
    await service.erpGet(admin, 'Student', 'STU-1');
    expect(tenantScope.assertDocBelongsToCompany).toHaveBeenCalledWith(
      { name: 'STU-1', company: 'Co A' },
      'Co A',
      'Student',
    );
  });

  it('blocks cross-tenant ERP method proxy for institute admin', async () => {
    await expect(
      service.erpCallMethod(admin, 'frappe.client.get_list', {}),
    ).rejects.toThrow(ForbiddenException);
  });

  it('blocks dangerous Moodle user enumeration for institute admin', async () => {
    await expect(
      service.moodleCall(admin, 'core_user_get_users', {}),
    ).rejects.toThrow(ForbiddenException);
  });

  it('scopes Moodle course listing to institute category', async () => {
    await service.moodleCall(admin, 'core_course_get_courses', {});
    expect(moodleAdapter.call).toHaveBeenCalledWith('core_course_get_courses_by_field', {
      field: 'category',
      value: '42',
    });
  });
});
