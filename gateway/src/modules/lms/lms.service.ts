import { Injectable } from '@nestjs/common';
import { MoodleAdapter } from '../../adapters/moodle/moodle.adapter';
import { MoodleTenantService } from '../../shared/moodle/moodle-tenant.service';
import { AuthenticatedUser } from '../../shared/tenant/tenant.types';

@Injectable()
export class LmsService {
  constructor(
    private readonly moodleAdapter: MoodleAdapter,
    private readonly moodleTenant: MoodleTenantService,
  ) {}

  listCourses(user: AuthenticatedUser) {
    return this.moodleTenant.listCoursesForUser(user);
  }

  async getCourseContents(courseId: number, user: AuthenticatedUser) {
    await this.moodleTenant.guardCourseAccess(user, courseId);
    return this.moodleAdapter.getCourseContents(courseId);
  }

  async getUserGrades(userId: number, courseId: number, user: AuthenticatedUser) {
    await this.moodleTenant.guardCourseAccess(user, courseId);
    return this.moodleAdapter.getUserGrades(userId, courseId);
  }

  async getCompletionStatus(courseId: number, userId: number, user: AuthenticatedUser) {
    await this.moodleTenant.guardCourseAccess(user, courseId);
    return this.moodleAdapter.getCompletionStatus(courseId, userId);
  }

  async createCourse(
    user: AuthenticatedUser,
    data: { fullname: string; shortname: string; categoryid?: number },
  ) {
    const categoryid = await this.moodleTenant.resolveCategoryId(user, data.categoryid);
    return this.moodleAdapter.createCourse({
      fullname: data.fullname,
      shortname: data.shortname,
      categoryid,
    });
  }

  async addCourseContent(
    courseId: number,
    user: AuthenticatedUser,
    data: { name: string; externalurl?: string; filename?: string; filecontentBase64?: string },
  ) {
    await this.moodleTenant.guardCourseAccess(user, courseId);
    if (data.externalurl) {
      return this.moodleAdapter.addUrlModule(courseId, 1, data.name, data.externalurl);
    }
    if (data.filename && data.filecontentBase64) {
      return this.moodleAdapter.uploadDraftFile(data.filename, data.filecontentBase64);
    }
    return this.moodleAdapter.addUrlModule(courseId, 1, data.name, '#');
  }
}
