import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MoodleAdapter } from './moodle.adapter';
import { EducationAdapter } from '../erpnext/education.adapter';
import { StudentCreatedPayload, StudentEnrolledPayload, TestSubmittedPayload } from '../../shared/events/event-types';

@Injectable()
export class MoodleSyncService {
  private readonly logger = new Logger(MoodleSyncService.name);

  constructor(
    private readonly moodleAdapter: MoodleAdapter,
    private readonly erpAdapter: EducationAdapter,
  ) {}

  @OnEvent('student.created')
  async handleStudentCreated(payload: StudentCreatedPayload) {
    this.logger.log(`Syncing student ${payload.erpStudentName} to Moodle`);
    try {
      // Create user in Moodle
      const moodleUserId = await this.moodleAdapter.createUser({
        username: payload.phone || payload.erpStudentName, // Or some logic
        firstname: payload.studentName.split(' ')[0],
        lastname: payload.studentName.split(' ').slice(1).join(' ') || 'Student',
        email: payload.email || `${payload.erpStudentName}@example.com`,
      });

      // Update ERPNext
      await this.erpAdapter.updateStudentMoodleId(payload.erpStudentName, moodleUserId);
      this.logger.log(`Student ${payload.erpStudentName} synced to Moodle ID: ${moodleUserId}`);
    } catch (error) {
      const err = error as any;
      this.logger.error(`Failed to sync student to Moodle: ${err.message}`, err.stack);
    }
  }

  @OnEvent('student.enrolled')
  async handleStudentEnrolled(payload: StudentEnrolledPayload) {
    this.logger.log(`Syncing student enrollment ${payload.erpStudentName} to Moodle`);
    try {
      // Here we would need to map the batch/studentGroup to a Moodle course.
      // Assuming we have a Moodle course ID mapping.
      // For simplicity, we assume there's a way to get moodle_course_id from the studentGroup (Batch).
      const batch = await this.erpAdapter.getDoc('Student Group', payload.studentGroupName);
      const student = await this.erpAdapter.getDoc('Student', payload.erpStudentName);

      const moodleCourseId = batch?.custom_moodle_course_id;
      const moodleUserId = student?.custom_moodle_id;

      if (moodleCourseId && moodleUserId) {
        await this.moodleAdapter.enrollStudent(moodleCourseId, moodleUserId);
        this.logger.log(`Enrolled student ${moodleUserId} in Moodle course ${moodleCourseId}`);
      } else {
        this.logger.warn(`Missing mapping for enrollment sync. MoodleCourse: ${moodleCourseId}, MoodleUser: ${moodleUserId}`);
      }
    } catch (error) {
      const err = error as any;
      this.logger.error(`Failed to sync enrollment to Moodle: ${err.message}`, err.stack);
    }
  }

  // To validate Assessment -> Moodle Gradebook, wait... Moodle to ERPNext Assessment, or ERPNext Assessment to Moodle?
  // "Assessment -> Moodle Gradebook" means Moodle to ERPNext?
  // Actually, Moodle is the LMS where tests happen. ERPNext is the system of record.
  // Wait, if a Test is submitted in Moodle, we get `lms.test.submitted`.
  @OnEvent('lms.test.submitted')
  async handleTestSubmitted(payload: TestSubmittedPayload) {
    this.logger.log(`Syncing test submission for ${payload.erpStudentName} to ERPNext`);
    try {
      // Sync grades to ERPNext
      await this.erpAdapter.saveAssessmentResult({
        student: payload.erpStudentName,
        assessment_plan: payload.assessmentPlanName,
        student_group: payload.studentGroupName,
        total_score: payload.score, // Or whatever logic
        maximum_score: 100, // Hardcoded for now, would depend on assessment plan
        score: payload.score,
        custom_rank: payload.rank,
        custom_percentile: payload.percentile
      });
      this.logger.log(`Test score for ${payload.erpStudentName} synced to ERPNext`);
    } catch (error) {
      const err = error as any;
      this.logger.error(`Failed to sync test to ERPNext: ${err.message}`, err.stack);
    }
  }

  @OnEvent('lms.results.published')
  async handleResultsPublished(payload: any) {
    this.logger.log(`Syncing published results to Moodle Gradebook for ${payload.erpStudentName}`);
    try {
      const student = await this.erpAdapter.getDoc('Student', payload.erpStudentName);
      const moodleUserId = student?.custom_moodle_id;
      const batch = await this.erpAdapter.getDoc('Student Group', payload.studentGroupName);
      const moodleCourseId = batch?.custom_moodle_course_id;

      if (moodleCourseId && moodleUserId) {
        // Assume payload.itemId is the Moodle grade item ID
        await this.moodleAdapter.updateGrade('erpnext', moodleCourseId, 'mod', 'assign', 1, 0, {
          0: {
            userid: moodleUserId,
            grade: payload.score
          }
        });
        this.logger.log(`Synced grade to Moodle for user ${moodleUserId}`);
      } else {
        this.logger.warn(`Missing mapping for grade sync. Course: ${moodleCourseId}, User: ${moodleUserId}`);
      }
    } catch (error) {
      const err = error as any;
      this.logger.error(`Failed to sync grade to Moodle: ${err.message}`, err.stack);
    }
  }
}
