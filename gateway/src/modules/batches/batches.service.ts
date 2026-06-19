import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EducationAdapter } from '../../adapters/erpnext/education.adapter';
import { CreateBatchDto, EnrollStudentDto, ScheduleBatchDto } from './dto/batch.dto';

@Injectable()
export class BatchesService {
  private readonly logger = new Logger(BatchesService.name);

  constructor(
    private readonly erpAdapter: EducationAdapter,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateBatchDto) {
    const batch = await this.erpAdapter.createBatch({
      student_group_name: dto.name,
      program: dto.program,
      academic_term: dto.academic_term,
      academic_year: dto.academic_year,
    });
    return batch;
  }

  async list() {
    return [{ id: 'mock-batch', name: 'Mock Batch' }]; // Mock
  }

  async getOne(id: string) {
    return { id, name: `Mock Batch ${id}` };
  }

  async enroll(batchId: string, dto: EnrollStudentDto) {
    const result = await this.erpAdapter.enrollStudentInBatch(dto.studentId, batchId);
    this.eventEmitter.emit('student.enrolled', { studentId: dto.studentId, batchId });
    return result;
  }

  async schedule(batchId: string, dto: ScheduleBatchDto) {
    return { message: `Batch ${batchId} scheduled`, ...dto };
  }

  async assignInstructor(batchId: string, instructorId: string) {
    return { message: `Instructor ${instructorId} assigned to batch ${batchId}` };
  }
}
