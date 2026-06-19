import { Injectable, ForbiddenException } from '@nestjs/common';
import { EducationAdapter } from '../../adapters/erpnext/education.adapter';

@Injectable()
export class EducationPortalService {
  constructor(private readonly erpAdapter: EducationAdapter) {}

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
}
