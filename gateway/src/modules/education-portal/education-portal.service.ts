import { Injectable, ForbiddenException } from '@nestjs/common';
import { EducationAdapter } from '../../adapters/erpnext/education.adapter';
import { TenantScopeService } from '../../shared/tenant/tenant-scope.service';

@Injectable()
export class EducationPortalService {
  constructor(
    private readonly erpAdapter: EducationAdapter,
    private readonly tenantScope: TenantScopeService,
  ) {}

  private assertStudentAccess(requestedStudent: string, user: any) {
    if (user.role === 'parent') {
      const linked: string[] = user.linkedStudents || [];
      if (!linked.includes(requestedStudent)) {
        throw new ForbiddenException('Not authorized for this student');
      }
    } else if (user.role === 'student' && user.userId !== requestedStudent) {
      throw new ForbiddenException('Not authorized for this student');
    }
  }

  getSchedule(studentId: string, user: any) {
    this.assertStudentAccess(studentId, user);
    return this.erpAdapter.getCourseScheduleForStudent(studentId);
  }

  getAttendance(studentId: string, studentGroup: string, user: any) {
    this.assertStudentAccess(studentId, user);
    return this.erpAdapter.getStudentAttendanceCalendar(studentId, studentGroup);
  }

  getInvoices(studentId: string, user: any) {
    this.assertStudentAccess(studentId, user);
    return this.erpAdapter.getStudentInvoices(studentId);
  }

  getPrograms(studentId: string, user: any) {
    this.assertStudentAccess(studentId, user);
    return this.erpAdapter.getStudentPrograms(studentId);
  }

  getGrades(studentId: string, program: string, user: any) {
    this.assertStudentAccess(studentId, user);
    return this.erpAdapter.getAssessmentResults(studentId, program);
  }

  applyLeave(data: {
    student: string;
    from_date: string;
    to_date: string;
    reason: string;
    student_group: string;
  }, user: any) {
    this.assertStudentAccess(data.student, user);
    return this.erpAdapter.applyLeave(data);
  }

  getChildrenForParent(user: any) {
    if (user.role !== 'parent') {
      throw new ForbiddenException('Parent role required');
    }
    return this.erpAdapter.getStudentsByGuardian(user.userId);
  }

  listInstructors(tenantId: string) {
    return this.erpAdapter.getInstituteCompany(tenantId).then((company) =>
      this.erpAdapter.listInstructors(company),
    );
  }

  listLeaveRequests(tenantId: string) {
    return this.erpAdapter.getInstituteCompany(tenantId).then((company) =>
      this.erpAdapter.listLeaveApplications(company),
    );
  }

  async updateLeaveRequest(name: string, status: string, tenantId: string) {
    const company = await this.tenantScope.getCompanyForTenant(tenantId);
    const leave = await this.erpAdapter.getDoc('Student Leave Application', name);
    this.tenantScope.assertDocBelongsToCompany(leave, company, 'Student Leave Application');
    return this.erpAdapter.updateLeaveApplication(name, status);
  }

  createAssessmentResult(data: {
    student: string;
    assessment_plan: string;
    program: string;
    course: string;
    total_score: number;
    maximum_score: number;
  }) {
    return this.erpAdapter.saveAssessmentResult(data);
  }

  createInstructor(data: {
    instructor_name: string;
    cell_number?: string;
    email_address?: string;
  }, tenantId: string) {
    return this.erpAdapter.getInstituteCompany(tenantId).then((company) =>
      this.erpAdapter.createInstructor({ ...data, company }),
    );
  }

  async deactivateInstructor(name: string, tenantId: string) {
    const company = await this.tenantScope.getCompanyForTenant(tenantId);
    const instructor = await this.erpAdapter.getDoc('Instructor', name);
    this.tenantScope.assertDocBelongsToCompany(instructor, company, 'Instructor');
    return this.erpAdapter.updateDoc('Instructor', name, { status: 'Left' });
  }
}
