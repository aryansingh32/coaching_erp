import { Injectable } from '@nestjs/common';
import { MoodleAdapter } from '../../adapters/moodle/moodle.adapter';

@Injectable()
export class LmsService {
  constructor(private readonly moodleAdapter: MoodleAdapter) {}

  listCourses() {
    return this.moodleAdapter.getCourses();
  }

  getCourseContents(courseId: number) {
    return this.moodleAdapter.getCourseContents(courseId);
  }

  getUserGrades(userId: number, courseId: number) {
    return this.moodleAdapter.getUserGrades(userId, courseId);
  }

  getCompletionStatus(courseId: number, userId: number) {
    return this.moodleAdapter.getCompletionStatus(courseId, userId);
  }
}
