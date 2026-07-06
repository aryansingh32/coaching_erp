import { ForbiddenException, Injectable } from '@nestjs/common';
import { MoodleAdapter } from '../../adapters/moodle/moodle.adapter';
import { TenantScopeService } from '../tenant/tenant-scope.service';
import { AuthenticatedUser } from '../tenant/tenant.types';

@Injectable()
export class MoodleTenantService {
  private categoryCourseCache = new Map<string, Set<number>>();

  constructor(
    private readonly moodleAdapter: MoodleAdapter,
    private readonly tenantScope: TenantScopeService,
  ) {}

  async listTenantCourses(tenantId: string): Promise<any[]> {
    const categoryId = await this.tenantScope.getMoodleCategoryId(tenantId);
    return this.moodleAdapter.call('core_course_get_courses_by_field', {
      field: 'category',
      value: categoryId,
    });
  }

  async assertCourseInTenant(courseId: number, tenantId: string): Promise<void> {
    const categoryId = await this.tenantScope.getMoodleCategoryId(tenantId);
    let allowed = this.categoryCourseCache.get(categoryId);
    if (!allowed) {
      const courses = await this.moodleAdapter.call('core_course_get_courses_by_field', {
        field: 'category',
        value: categoryId,
      });
      allowed = new Set((courses || []).map((c: { id: number }) => c.id));
      this.categoryCourseCache.set(categoryId, allowed);
    }
    if (!allowed.has(courseId)) {
      throw new ForbiddenException('Course does not belong to your institute');
    }
  }

  async assertCoursesInTenant(courseIds: number[], tenantId: string): Promise<void> {
    for (const courseId of courseIds) {
      await this.assertCourseInTenant(courseId, tenantId);
    }
  }

  async listCoursesForUser(user: AuthenticatedUser): Promise<any[]> {
    if (this.tenantScope.isSuperAdmin(user)) {
      return this.moodleAdapter.getCourses();
    }
    return this.listTenantCourses(user.tenantId!);
  }

  async guardCourseAccess(user: AuthenticatedUser, courseId: number): Promise<void> {
    if (this.tenantScope.isSuperAdmin(user)) return;
    await this.assertCourseInTenant(courseId, user.tenantId!);
  }

  async guardCoursesAccess(user: AuthenticatedUser, courseIds: number[]): Promise<void> {
    if (this.tenantScope.isSuperAdmin(user)) return;
    await this.assertCoursesInTenant(courseIds, user.tenantId!);
  }

  async resolveCategoryId(user: AuthenticatedUser, categoryid?: number): Promise<number> {
    if (this.tenantScope.isSuperAdmin(user)) {
      return categoryid ?? 1;
    }
    const category = await this.tenantScope.getMoodleCategoryId(user.tenantId!);
    return parseInt(category, 10);
  }
}
