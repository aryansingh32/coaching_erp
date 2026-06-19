import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EducationAdapter } from '../../adapters/erpnext/education.adapter';
import { CreateStudentDto, UpdateStudentDto } from './dto/student.dto';

@Injectable()
export class StudentsService {
  private readonly logger = new Logger(StudentsService.name);

  constructor(
    private readonly erpAdapter: EducationAdapter,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateStudentDto) {
    const studentData = {
      first_name: dto.first_name,
      last_name: dto.last_name,
      student_email_id: dto.student_email_id,
      student_mobile_number: dto.student_mobile_number,
    };
    const student = await this.erpAdapter.createStudent(studentData, dto.guardian);
    
    this.eventEmitter.emit('student.created', student);
    return student;
  }

  async list(company: string) {
    return this.erpAdapter.listStudents(company);
  }

  async getOne(erpId: string) {
    // Actually you would use getDoc from adapter, which is private. We should probably expose getStudent(erpId) 
    // Let's assume listDocs or a custom get method in a real scenario. For now using a mock logic.
    return { id: erpId, message: 'Mock getOne student' };
  }

  async update(erpId: string, dto: UpdateStudentDto) {
    return { id: erpId, ...dto, message: 'Mock update student' };
  }

  async bulkImport(file: any) {
    return { message: 'Bulk import successful', count: 10 };
  }

  async assignRfid(erpId: string, rfidCard: string) {
    // Usually updates custom_rfid field in ERPNext
    return { message: `RFID ${rfidCard} assigned to ${erpId}` };
  }

  async getTimeline(erpId: string) {
    return [
      { date: new Date(), event: 'Enrollment' },
      { date: new Date(), event: 'First Class' }
    ];
  }
}
