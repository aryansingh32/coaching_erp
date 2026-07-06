import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ErpCacheService } from '../../infrastructure/cache/erp-cache.service';

@Injectable()
export class EducationAdapter {
  private readonly logger = new Logger(EducationAdapter.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly cacheService: ErpCacheService,
  ) {
    this.baseUrl = this.configService.get<string>('ERPNEXT_URL');
    this.apiKey = this.configService.get<string>('ERPNEXT_API_KEY');
    this.apiSecret = this.configService.get<string>('ERPNEXT_API_SECRET');
  }

  private get headers() {
    return {
      Authorization: `token ${this.apiKey}:${this.apiSecret}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  public async getDoc(doctype: string, name: string): Promise<any> {
    const url = `${this.baseUrl}/api/resource/${doctype}/${name}`;
    const response = await firstValueFrom(this.httpService.get(url, { headers: this.headers }));
    return response.data.data;
  }

  public async createDoc(doctype: string, data: any): Promise<any> {
    const url = `${this.baseUrl}/api/resource/${doctype}`;
    const response = await firstValueFrom(this.httpService.post(url, data, { headers: this.headers }));
    return response.data.data;
  }

  public async updateDoc(doctype: string, name: string, data: any): Promise<any> {
    const url = `${this.baseUrl}/api/resource/${doctype}/${name}`;
    const response = await firstValueFrom(this.httpService.put(url, data, { headers: this.headers }));
    return response.data.data;
  }

  public async listDocs(doctype: string, filters?: any, fields: string[] = ['*']): Promise<any[]> {
    const url = `${this.baseUrl}/api/resource/${doctype}`;
    const params: any = { fields: JSON.stringify(fields) };
    if (filters) {
      params.filters = JSON.stringify(filters);
    }
    const response = await firstValueFrom(this.httpService.get(url, { headers: this.headers, params }));
    return response.data.data;
  }

  public async callMethod(method: string, data: any): Promise<any> {
    const url = `${this.baseUrl}/api/method/${method}`;
    const response = await firstValueFrom(this.httpService.post(url, data, { headers: this.headers }));
    return response.data.message;
  }

  async createStudent(studentData: any, guardianData?: any): Promise<any> {
    let guardian = null;
    if (guardianData) {
      guardian = await this.createDoc('Guardian', guardianData);
    }
    const student = await this.createDoc('Student', studentData);
    if (guardian) {
      await this.updateDoc('Student', student.name, {
        guardians: [{ guardian: guardian.name, relation: 'Parent' }]
      });
    }
    return student;
  }

  async getStudentByPhone(phone: string): Promise<any> {
    const cacheKey = `erpnext:student:phone:${phone}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    const students = await this.listDocs('Student', [['student_mobile_number', '=', phone]]);
    if (!students || students.length === 0) {
      throw new HttpException('Student not found', HttpStatus.NOT_FOUND);
    }
    const student = students[0];
    await this.cacheService.set(cacheKey, student, 3600);
    return student;
  }

  async updateStudentMoodleId(studentName: string, moodleId: number, novuId?: string, fcmToken?: string): Promise<any> {
    return this.updateDoc('Student', studentName, { 
      custom_moodle_id: moodleId,
      custom_novu_subscriber_id: novuId,
      custom_fcm_token: fcmToken
    });
  }

  async createBatch(batchData: any): Promise<any> {
    return this.createDoc('Student Group', batchData);
  }

  async enrollStudentInBatch(studentName: string, batchName: string): Promise<any> {
    // Fix: Use generic doctype methods to append student to Student Group
    // The real operation is to add a row to the Student Group's students child table
    const studentGroup = await this.getDoc('Student Group', batchName);
    const existingStudents = studentGroup.students || [];
    const updatedStudents = [...existingStudents, { student: studentName }];
    return this.updateDoc('Student Group', batchName, { students: updatedStudents });
  }

  async createProgramEnrollment(data: any): Promise<any> {
    return this.createDoc('Program Enrollment', data);
  }

  async createAssessmentPlan(data: any): Promise<any> {
    return this.createDoc('Assessment Plan', data);
  }

  async saveAssessmentResult(data: any): Promise<any> {
    return this.createDoc('Assessment Result', data);
  }

  async createCourse(data: any): Promise<any> {
    return this.createDoc('Course', data);
  }

  async getCourse(name: string): Promise<any> {
    return this.getDoc('Course', name);
  }

  async markStudentAttendance(student: string, date: string, status: string, studentGroup: string): Promise<any> {
    return this.createDoc('Student Attendance', {
      student,
      date,
      status,
      student_group: studentGroup
    });
  }

  async createFeeStructure(data: any): Promise<any> {
    return this.createDoc('Fee Structure', data);
  }

  async createFeeScheduleForStudent(student: string, feeStructure: string): Promise<any> {
    // Fix: Implement the real three-step workflow for fee schedule creation
    // Step 1: Map Fee Structure to Fee Schedule template
    const feeScheduleTemplate = await this.callMethod('education.education.doctype.fee_schedule.fee_schedule.get_fee_structure', {
      source_name: feeStructure,
      target_doc: null
    });
    
    // Step 2: Create and submit Fee Schedule document
    const feeScheduleData = {
      ...feeScheduleTemplate,
      student_groups: [{ student_group: student }]
    };
    const feeSchedule = await this.createDoc('Fee Schedule', feeScheduleData);
    
    // Step 3: Submit the Fee Schedule and call create_fees document method
    await this.updateDoc('Fee Schedule', feeSchedule.name, { docstatus: 1 });
    
    // Call the document method to generate actual fees
    await this.callMethod('frappe.client.run_doc_method', {
      docs: JSON.stringify([feeSchedule]),
      method: 'create_fees',
      dt: 'Fee Schedule',
      dn: feeSchedule.name
    });
    
    return feeSchedule;
  }

  async recordFeePayment(data: any): Promise<any> {
    return this.createDoc('Payment Entry', data);
  }

  async createInstructor(data: any): Promise<any> {
    return this.createDoc('Instructor', data);
  }

  async ensureProgram(name: string): Promise<any> {
    try {
      return await this.getDoc('Program', name);
    } catch {
      return this.createDoc('Program', { program_name: name, program_abbreviation: name });
    }
  }

  async createAdmissionInquiry(data: any): Promise<any> {
    return this.createDoc('Student Admission', data);
  }

  async getInstituteCompany(tenantId: string): Promise<string> {
    const companies = await this.listDocs('Company', [['custom_tenant_id', '=', tenantId]]);
    if (companies && companies.length > 0) {
      return companies[0].name;
    }
    return this.configService.get<string>('ERPNEXT_DEFAULT_COMPANY');
  }

  async listStudents(company: string): Promise<any[]> {
    return this.listDocs('Student', [['company', '=', company]]);
  }

  async getInstructorByPhone(phone: string): Promise<any> {
    const instructors = await this.listDocs('Instructor', [['cell_number', '=', phone]]);
    if (!instructors?.length) {
      throw new HttpException('Instructor not found', HttpStatus.NOT_FOUND);
    }
    return instructors[0];
  }

  async getGuardianByPhone(phone: string): Promise<any> {
    const guardians = await this.listDocs('Guardian', [['mobile_number', '=', phone]]);
    if (!guardians?.length) {
      throw new HttpException('Guardian not found', HttpStatus.NOT_FOUND);
    }
    return guardians[0];
  }

  async getStudentsByGuardian(guardianName: string): Promise<any[]> {
    const students = await this.listDocs('Student');
    return students.filter((s: any) =>
      (s.guardians || []).some((g: any) => g.guardian === guardianName)
    );
  }

  async getStudentPrograms(studentName: string): Promise<any> {
    return this.callMethod('education.education.api.get_student_programs', { student: studentName });
  }

  async getStudentAttendanceCalendar(studentName: string, studentGroup: string): Promise<any> {
    return this.callMethod('education.education.api.get_student_attendance', {
      student: studentName,
      student_group: studentGroup,
    });
  }

  async getCourseScheduleForStudent(studentName: string): Promise<any> {
    return this.callMethod('education.education.api.get_course_schedule_for_student', {
      student: studentName,
    });
  }

  async getStudentInvoices(studentName: string): Promise<any> {
    return this.callMethod('education.education.api.get_student_invoices', {
      student: studentName,
    });
  }

  async applyLeave(data: {
    student: string;
    from_date: string;
    to_date: string;
    reason: string;
    student_group: string;
  }): Promise<any> {
    return this.callMethod('education.education.api.apply_leave', data);
  }

  async getAssessmentResults(studentName: string, program: string): Promise<any> {
    const results = await this.listDocs('Assessment Result', [
      ['student', '=', studentName],
      ['program', '=', program],
    ]);
    return results;
  }

  async listInstructors(company?: string): Promise<any[]> {
    const filters = company ? [['company', '=', company]] : undefined;
    return this.listDocs('Instructor', filters, ['name', 'instructor_name', 'cell_number', 'email_address', 'status']);
  }

  async listBatchStudents(batchId: string): Promise<any[]> {
    return this.listDocs('Student Group Student', [['parent', '=', batchId]], [
      'student',
      'student_name',
      'group_roll_number',
    ]);
  }

  async listLeaveApplications(company?: string): Promise<any[]> {
    const filters = company ? [['company', '=', company]] : undefined;
    return this.listDocs('Student Leave Application', filters);
  }

  async updateLeaveApplication(name: string, status: string): Promise<any> {
    return this.updateDoc('Student Leave Application', name, { status });
  }

  async getUserByEmail(email: string): Promise<any> {
    const users = await this.listDocs('User', [['email', '=', email]], ['name', 'email', 'enabled', 'custom_approval_status', 'full_name']);
    if (!users || users.length === 0) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return users[0];
  }

  async getStudentByEmail(email: string): Promise<any> {
    const students = await this.listDocs('Student', [['student_email_id', '=', email]]);
    if (!students || students.length === 0) return null;
    return students[0];
  }

  async getInstructorByEmail(email: string): Promise<any> {
    const instructors = await this.listDocs('Instructor', [['email_address', '=', email]]);
    if (!instructors || instructors.length === 0) return null;
    return instructors[0];
  }

  async getGuardianByEmail(email: string): Promise<any> {
    const guardians = await this.listDocs('Guardian', [['email_address', '=', email]]);
    if (!guardians || guardians.length === 0) return null;
    return guardians[0];
  }

  async createUser(data: any): Promise<any> {
    return this.createDoc('User', data);
  }
}
