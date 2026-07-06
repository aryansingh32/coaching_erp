import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';

@Injectable()
export class MoodleAdapter {
  private readonly logger = new Logger(MoodleAdapter.name);
  private readonly baseUrl: string;
  private readonly token: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.baseUrl = this.configService.get<string>('MOODLE_URL');
    this.token = this.configService.get<string>('MOODLE_ADMIN_TOKEN');
  }

  async call(wsFunction: string, params: any = {}): Promise<any> {
    const url = `${this.baseUrl}/webservice/rest/server.php`;
    const searchParams = new URLSearchParams();
    searchParams.append('wstoken', this.token);
    searchParams.append('wsfunction', wsFunction);
    searchParams.append('moodlewsrestformat', 'json');

    Object.keys(params).forEach((key) => {
      if (typeof params[key] === 'object') {
        Object.keys(params[key]).forEach((subKey) => {
          searchParams.append(`${key}[${subKey}]`, params[key][subKey]);
        });
      } else {
        searchParams.append(key, params[key]);
      }
    });

    const response = await firstValueFrom(
      this.httpService.post(url, searchParams.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }),
    );

    if (response.data?.exception) {
      this.logger.error(`Moodle API Error: ${response.data.message}`);
      throw new Error(`Moodle API Error: ${response.data.message}`);
    }
    return response.data;
  }

  async createUser(dto: any): Promise<number> {
    const randomPassword = crypto.randomBytes(12).toString('base64') + 'A1!'; // random complex password
    const payload = {
      users: {
        0: {
          username: dto.username,
          password: randomPassword,
          firstname: dto.firstname,
          lastname: dto.lastname || 'Student',
          email: dto.email,
        },
      },
    };
    const response = await this.call('core_user_create_users', payload);
    return response[0].id;
  }

  async enrollStudent(courseId: number, userId: number): Promise<void> {
    await this.call('enrol_manual_enrol_users', {
      enrolments: {
        0: {
          roleid: 5, // student role
          userid: userId,
          courseid: courseId,
        },
      },
    });
  }

  async getCourseContents(courseId: number): Promise<any> {
    return this.call('core_course_get_contents', { courseid: courseId });
  }

  async getUserGrades(userId: number, courseId: number): Promise<any> {
    return this.call('gradereport_user_get_grade_items', {
      userid: userId,
      courseid: courseId,
    });
  }

  async updateGrade(source: string, courseId: number, itemType: string, itemModule: string, itemInstance: number, itemNumber: number, grades: any): Promise<any> {
    return this.call('core_grades_update_grades', {
      source,
      courseid: courseId,
      component: itemType + '_' + itemModule,
      activityid: itemInstance,
      itemnumber: itemNumber,
      grades: grades
    });
  }

  async createCategory(dto: any): Promise<number> {
    const payload = {
      categories: {
        0: {
          name: dto.name,
          parent: dto.parent || 0,
        },
      },
    };
    const response = await this.call('core_course_create_categories', payload);
    return response[0].id;
  }

  async createCourse(dto: any): Promise<number> {
    const payload = {
      courses: {
        0: {
          fullname: dto.fullname,
          shortname: dto.shortname,
          categoryid: dto.categoryid,
        },
      },
    };
    const response = await this.call('core_course_create_courses', payload);
    return response[0].id;
  }

  async getCompletionStatus(courseId: number, userId: number): Promise<any> {
    return this.call('core_completion_get_course_completion_status', {
      courseid: courseId,
      userid: userId,
    });
  }

  async getCourses(): Promise<any[]> {
    return this.call('core_course_get_courses', {});
  }

  async getQuizzesByCourses(courseIds: number[]): Promise<any[]> {
    const quizzes: any[] = [];
    for (const courseId of courseIds) {
      const courseQuizzes = await this.call('mod_quiz_get_quizzes_by_courses', {
        'courseids[0]': courseId,
      });
      if (Array.isArray(courseQuizzes?.quizzes)) {
        quizzes.push(...courseQuizzes.quizzes.map((q: any) => ({ ...q, courseid: courseId })));
      }
    }
    return quizzes;
  }

  async startQuizAttempt(quizId: number, userId?: number): Promise<any> {
    const params: Record<string, number> = { quizid: quizId };
    if (userId) params.userid = userId;
    return this.call('mod_quiz_start_attempt', params);
  }

  async getQuizAttemptData(attemptId: number, page: number = 0): Promise<any> {
    return this.call('mod_quiz_get_attempt_data', { attemptid: attemptId, page });
  }

  async getQuizAttemptReview(attemptId: number, page: number = 0): Promise<any> {
    return this.call('mod_quiz_get_attempt_review', { attemptid: attemptId, page });
  }

  async submitQuizAttempt(attemptId: number, answers: Record<string, string>): Promise<any> {
    const params: Record<string, string | number> = { attemptid: attemptId, finishattempt: 1 };
    Object.entries(answers).forEach(([slot, value], index) => {
      params[`data[${index}][name]`] = slot;
      params[`data[${index}][value]`] = value;
    });
    return this.call('mod_quiz_process_attempt', params);
  }

  async createQuiz(courseId: number, name: string, intro?: string): Promise<any> {
    return this.call('mod_quiz_add_quiz', {
      courseid: courseId,
      name,
      intro: intro ?? '',
      introformat: 1,
      timeopen: 0,
      timeclose: 0,
      timelimit: 0,
      grade: 100,
    });
  }

  async uploadDraftFile(
    filename: string,
    filecontentBase64: string,
    contextLevel = 'user',
    instanceId = 0,
  ): Promise<any> {
    return this.call('core_files_upload', {
      contextlevel: contextLevel,
      instanceid: instanceId,
      component: 'user',
      filearea: 'draft',
      itemid: 0,
      filepath: '/',
      filename,
      filecontent: filecontentBase64,
    });
  }

  async createActivity(courseId: number, section: number, type: string, name: string, options: any = {}): Promise<any> {
    if (type === 'quiz') {
      return this.createQuiz(courseId, name, options.intro);
    }
    return this.call('core_course_edit_module', {
      action: 'create',
      courseid: courseId,
      modulename: type,
      section,
      name,
      ...options,
    });
  }

  async addForumDiscussion(forumId: number, subject: string, message: string): Promise<any> {
    return this.call('mod_forum_add_discussion', {
      forumid: forumId,
      subject,
      message,
    });
  }

  async replyToDiscussion(discussionId: number, message: string): Promise<any> {
    return this.call('mod_forum_add_discussion_post', {
      postid: discussionId,
      message,
    });
  }

  async getAssignments(courseIds?: number[]): Promise<any> {
    const params: any = {};
    if (courseIds && courseIds.length > 0) {
      courseIds.forEach((id, i) => {
        params[`courseids[${i}]`] = id;
      });
    }
    return this.call('mod_assign_get_assignments', params);
  }

  async getSubmissions(assignmentIds: number[]): Promise<any> {
    const params: any = {};
    assignmentIds.forEach((id, i) => {
      params[`assignmentids[${i}]`] = id;
    });
    return this.call('mod_assign_get_submissions', params);
  }

  async saveSubmission(assignmentId: number, plugindata: any): Promise<any> {
    return this.call('mod_assign_save_submission', {
      assignmentid: assignmentId,
      plugindata,
    });
  }
}
