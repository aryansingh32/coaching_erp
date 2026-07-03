import { Injectable, ForbiddenException } from '@nestjs/common';
import { EducationAdapter } from '../../adapters/erpnext/education.adapter';
import { MoodleAdapter } from '../../adapters/moodle/moodle.adapter';
import { TenantScopeService, COMPANY_SCOPED_DOCTYPES } from '../../shared/tenant/tenant-scope.service';
import { AuthenticatedUser } from '../../shared/tenant/tenant.types';

const BLOCKED_DOCTYPES = ['System Settings', 'User', 'Role', 'Module Def', 'Company'];

/** Moodle functions that enumerate users or cross tenant boundaries. */
const BLOCKED_MOODLE_FUNCTIONS = new Set([
  'core_user_get_users',
  'core_user_get_users_by_field',
  'core_user_create_users',
  'core_user_update_users',
  'core_user_delete_users',
  'core_role_assign_roles',
  'core_role_unassign_roles',
  'tool_usertours_fetch_user_tour',
]);

/** Institute-safe Moodle functions (course/content/quiz scoped). */
const ALLOWED_MOODLE_FUNCTIONS = new Set([
  'core_course_get_courses',
  'core_course_get_courses_by_field',
  'core_course_get_contents',
  'core_course_get_categories',
  'mod_quiz_get_quizzes_by_courses',
  'mod_quiz_add_quiz',
  'core_course_create_courses',
  'core_course_edit_module',
  'core_files_upload',
  'core_files_get_files',
]);

@Injectable()
export class ProxyService {
  constructor(
    private readonly erpAdapter: EducationAdapter,
    private readonly moodleAdapter: MoodleAdapter,
    private readonly tenantScope: TenantScopeService,
  ) {}

  private guardDoctype(doctype: string) {
    if (BLOCKED_DOCTYPES.includes(doctype)) {
      throw new ForbiddenException(`Access to ${doctype} is restricted`);
    }
  }

  private async resolveCompany(user: AuthenticatedUser): Promise<string | null> {
    if (this.tenantScope.isSuperAdmin(user)) return null;
    if (!user.tenantId) {
      throw new ForbiddenException('Tenant context missing from token');
    }
    return this.tenantScope.getCompanyForTenant(user.tenantId);
  }

  async erpList(
    user: AuthenticatedUser,
    doctype: string,
    filters?: string,
    fields?: string,
  ) {
    this.guardDoctype(doctype);
    const parsedFilters = filters ? JSON.parse(filters) : undefined;
    const parsedFields = fields ? JSON.parse(fields) : ['*'];
    const company = await this.resolveCompany(user);
    const scopedFilters =
      company && COMPANY_SCOPED_DOCTYPES.has(doctype)
        ? this.tenantScope.mergeCompanyFilters(parsedFilters, company)
        : parsedFilters;
    return this.erpAdapter.listDocs(doctype, scopedFilters, parsedFields);
  }

  async erpGet(user: AuthenticatedUser, doctype: string, name: string) {
    this.guardDoctype(doctype);
    const doc = await this.erpAdapter.getDoc(doctype, name);
    const company = await this.resolveCompany(user);
    if (company) {
      this.tenantScope.assertDocBelongsToCompany(doc, company, doctype);
    }
    return doc;
  }

  async erpCreate(
    user: AuthenticatedUser,
    doctype: string,
    data: Record<string, unknown>,
  ) {
    this.guardDoctype(doctype);
    const company = await this.resolveCompany(user);
    const payload =
      company
        ? this.tenantScope.injectCompanyIntoData(data, company, doctype)
        : data;
    return this.erpAdapter.createDoc(doctype, payload);
  }

  async erpUpdate(
    user: AuthenticatedUser,
    doctype: string,
    name: string,
    data: Record<string, unknown>,
  ) {
    this.guardDoctype(doctype);
    const company = await this.resolveCompany(user);
    if (company) {
      const existing = await this.erpAdapter.getDoc(doctype, name);
      this.tenantScope.assertDocBelongsToCompany(existing, company, doctype);
      if ('company' in data && data.company !== company) {
        throw new ForbiddenException('Cannot change document company');
      }
    }
    return this.erpAdapter.updateDoc(doctype, name, data);
  }

  async erpCallMethod(
    user: AuthenticatedUser,
    method: string,
    data: Record<string, unknown>,
  ) {
    if (method.includes('install') || method.includes('delete')) {
      throw new ForbiddenException('Method not allowed');
    }
    if (!this.tenantScope.isSuperAdmin(user)) {
      throw new ForbiddenException('ERP method proxy is restricted to super admin');
    }
    return this.erpAdapter.callMethod(method, data);
  }

  async moodleCall(
    user: AuthenticatedUser,
    wsFunction: string,
    params: Record<string, unknown>,
  ) {
    if (BLOCKED_MOODLE_FUNCTIONS.has(wsFunction)) {
      throw new ForbiddenException(`Moodle function ${wsFunction} is restricted`);
    }

    if (!this.tenantScope.isSuperAdmin(user)) {
      if (!ALLOWED_MOODLE_FUNCTIONS.has(wsFunction)) {
        throw new ForbiddenException(`Moodle function ${wsFunction} is not allowed for institute users`);
      }
      if (!user.tenantId) {
        throw new ForbiddenException('Tenant context missing from token');
      }
      const institute = await this.tenantScope.getInstitute(user.tenantId);
      const categoryId = institute.moodle_category_id;
      if (!categoryId) {
        throw new ForbiddenException(
          'Moodle category is not configured for this institute; proxy access denied',
        );
      }
      const scoped = this.scopeMoodleCall(wsFunction, params, categoryId);
      return this.moodleAdapter.call(scoped.wsFunction, scoped.params);
    }

    return this.moodleAdapter.call(wsFunction, params);
  }

  private scopeMoodleCall(
    wsFunction: string,
    params: Record<string, unknown>,
    categoryId: string,
  ): { wsFunction: string; params: Record<string, unknown> } {
    if (wsFunction === 'core_course_get_courses') {
      return {
        wsFunction: 'core_course_get_courses_by_field',
        params: { field: 'category', value: categoryId },
      };
    }
    if (wsFunction === 'core_course_get_courses_by_field') {
      return { wsFunction, params: { field: 'category', value: categoryId } };
    }
    if (wsFunction === 'core_course_create_courses') {
      return {
        wsFunction,
        params: {
          ...params,
          courses: this.injectCategoryIntoCourses(params.courses, categoryId),
        },
      };
    }
    return { wsFunction, params };
  }

  private injectCategoryIntoCourses(
    courses: unknown,
    categoryId: string,
  ): unknown {
    if (!courses || typeof courses !== 'object') return courses;
    const result: Record<string, unknown> = {};
    for (const [key, course] of Object.entries(courses as Record<string, unknown>)) {
      result[key] =
        course && typeof course === 'object'
          ? { ...(course as Record<string, unknown>), categoryid: categoryId }
          : course;
    }
    return result;
  }
}
