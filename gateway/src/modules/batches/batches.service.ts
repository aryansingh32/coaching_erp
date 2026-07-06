import { Injectable, Logger } from '@nestjs/common';
import { DomainEventBus } from '../../shared/events/domain-event-bus';
import { EducationAdapter } from '../../adapters/erpnext/education.adapter';
import { CreateBatchDto, EnrollStudentDto, ScheduleBatchDto } from './dto/batch.dto';
import { TenantScopeService } from '../../shared/tenant/tenant-scope.service';

@Injectable()
export class BatchesService {
  private readonly logger = new Logger(BatchesService.name);

  constructor(
    private readonly erpAdapter: EducationAdapter,
    private readonly eventBus: DomainEventBus,
    private readonly tenantScope: TenantScopeService,
  ) {}

  async create(dto: CreateBatchDto, tenantId: string) {
    const company = await this.tenantScope.getCompanyForTenant(tenantId);
    const batch = await this.erpAdapter.createBatch({
      student_group_name: dto.name,
      program: dto.program,
      academic_term: dto.academic_term,
      academic_year: dto.academic_year,
      company,
    });
    return batch;
  }

  async list(tenantId: string) {
    const company = await this.tenantScope.getCompanyForTenant(tenantId);
    return this.erpAdapter.listDocs(
      'Student Group',
      [['company', '=', company]],
      ['name', 'student_group_name', 'program', 'academic_year', 'academic_term'],
    );
  }

  async getOne(id: string, tenantId: string) {
    await this.tenantScope.assertBatchBelongsToTenant(id, tenantId);
    return this.erpAdapter.getDoc('Student Group', id);
  }

  async enroll(batchId: string, dto: EnrollStudentDto, tenantId: string) {
    await this.tenantScope.assertBatchBelongsToTenant(batchId, tenantId);
    await this.tenantScope.assertStudentBelongsToTenant(dto.studentId, tenantId);
    const result = await this.erpAdapter.enrollStudentInBatch(dto.studentId, batchId);
    await this.eventBus.publish('student.enrolled', { studentId: dto.studentId, batchId }, tenantId);
    return result;
  }

  async schedule(batchId: string, dto: ScheduleBatchDto, tenantId: string) {
    await this.tenantScope.assertBatchBelongsToTenant(batchId, tenantId);
    return { message: `Batch ${batchId} scheduled`, ...dto };
  }

  async assignInstructor(batchId: string, instructorId: string, tenantId: string) {
    await this.tenantScope.assertBatchBelongsToTenant(batchId, tenantId);
    return { message: `Instructor ${instructorId} assigned to batch ${batchId}` };
  }

  async getStudents(batchId: string, tenantId: string) {
    await this.tenantScope.assertBatchBelongsToTenant(batchId, tenantId);
    return this.erpAdapter.listBatchStudents(batchId);
  }
}
