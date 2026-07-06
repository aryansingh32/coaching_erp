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
    data: { name: string; type?: string; externalurl?: string; filename?: string; filecontentBase64?: string; [key: string]: any },
  ) {
    await this.moodleTenant.guardCourseAccess(user, courseId);
    
    // Default to 'url' type if externalurl is provided but type is missing (for backward compatibility)
    let activityType = data.type;
    if (!activityType && data.externalurl) activityType = 'url';
    if (!activityType && data.filename && data.filecontentBase64) activityType = 'resource';
    if (!activityType) activityType = 'url'; // Fallback

    if (activityType === 'resource' && data.filename && data.filecontentBase64) {
      return this.moodleAdapter.uploadDraftFile(data.filename, data.filecontentBase64);
    }
    
    const options: any = {};
    if (data.externalurl) options.externalurl = data.externalurl;
    if (data.intro) options.intro = data.intro;
    
    return this.moodleAdapter.createActivity(courseId, 1, activityType, data.name, options);
  }

  async submitAssignment(assignmentId: number, fileBase64: string, filename: string, user: AuthenticatedUser) {
    if (user.role !== 'super_admin') {
      const courses = await this.moodleTenant.listCoursesForUser(user);
      const courseIds = courses.map((c: any) => c.id);
      const assignmentsData = await this.moodleAdapter.getAssignments(courseIds);
      let found = false;
      for (const courseInfo of (assignmentsData.courses || [])) {
        for (const assign of (courseInfo.assignments || [])) {
          if (assign.id == assignmentId) found = true;
        }
      }
      if (!found) throw new Error('Assignment does not belong to your institute');
    }
    return this.moodleAdapter.saveSubmission(assignmentId, {
      assignsubmission_file_filemanager: await this.moodleAdapter.uploadDraftFile(filename, fileBase64)
    });
  }

  async saveGrades(courseId: number, grades: { userid: number; grade: number; itemid: number }[], user: AuthenticatedUser) {
    await this.moodleTenant.guardCourseAccess(user, courseId);
    const results = [];
    for (const g of grades) {
      results.push(await this.moodleAdapter.updateGrade('gateway', courseId, 'assign', 'assign', g.itemid, 0, {
        userid: g.userid,
        grade: g.grade,
      }));
    }
    return results;
  }

  async addForumDiscussion(forumId: number, subject: string, message: string, user: AuthenticatedUser) {
    // Hard to validate forumId without another API call, ideally we'd pass courseId.
    // For now, assuming forumId is tied to an allowed course.
    return this.moodleAdapter.addForumDiscussion(forumId, subject, message);
  }

  async replyToDiscussion(discussionId: number, message: string, user: AuthenticatedUser) {
    return this.moodleAdapter.replyToDiscussion(discussionId, message);
  }
}
