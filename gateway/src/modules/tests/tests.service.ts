import { Injectable } from '@nestjs/common';
import { MoodleAdapter } from '../../adapters/moodle/moodle.adapter';

@Injectable()
export class TestsService {
  constructor(private readonly moodleAdapter: MoodleAdapter) {}

  async listQuizzes(courseIds: number[]) {
    return this.moodleAdapter.getQuizzesByCourses(courseIds);
  }

  async startAttempt(quizId: number, userId?: number) {
    return this.moodleAdapter.startQuizAttempt(quizId, userId);
  }

  async getAttemptReview(attemptId: number, page?: number) {
    return this.moodleAdapter.getQuizAttemptReview(attemptId, page);
  }

  async submitAttempt(attemptId: number, answers: Record<string, string>) {
    return this.moodleAdapter.submitQuizAttempt(attemptId, answers);
  }
}
