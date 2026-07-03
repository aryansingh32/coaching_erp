import { Injectable } from '@nestjs/common';
import { MoodleAdapter } from '../../adapters/moodle/moodle.adapter';
import { MoodleTenantService } from '../../shared/moodle/moodle-tenant.service';
import { AuthenticatedUser } from '../../shared/tenant/tenant.types';

@Injectable()
export class TestsService {
  constructor(
    private readonly moodleAdapter: MoodleAdapter,
    private readonly moodleTenant: MoodleTenantService,
  ) {}

  async listQuizzes(courseIds: number[], user: AuthenticatedUser) {
    await this.moodleTenant.guardCoursesAccess(user, courseIds);
    return this.moodleAdapter.getQuizzesByCourses(courseIds);
  }

  async startAttempt(quizId: number, userId: number | undefined, user: AuthenticatedUser) {
    return this.moodleAdapter.startQuizAttempt(quizId, userId);
  }

  async getAttemptData(attemptId: number, page: number | undefined, user: AuthenticatedUser) {
    return this.moodleAdapter.getQuizAttemptData(attemptId, page);
  }

  async getAttemptReview(attemptId: number, page: number | undefined, user: AuthenticatedUser) {
    return this.moodleAdapter.getQuizAttemptReview(attemptId, page);
  }

  async submitAttempt(attemptId: number, answers: Record<string, string>, user: AuthenticatedUser) {
    return this.moodleAdapter.submitQuizAttempt(attemptId, answers);
  }

  async createQuiz(
    courseId: number,
    name: string,
    intro: string | undefined,
    user: AuthenticatedUser,
  ) {
    await this.moodleTenant.guardCourseAccess(user, courseId);
    return this.moodleAdapter.createQuiz(courseId, name, intro);
  }
}
