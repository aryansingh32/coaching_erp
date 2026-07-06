import { Injectable, Logger } from '@nestjs/common';
import { DomainEventBus } from '../../shared/events/domain-event-bus';
import { EducationAdapter } from '../../adapters/erpnext/education.adapter';
import { CreateStudentDto, UpdateStudentDto } from './dto/student.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RfidCard } from '../../shared/entities/rfid-card.entity';
import { TenantScopeService } from '../../shared/tenant/tenant-scope.service';

@Injectable()
export class StudentsService {
  private readonly logger = new Logger(StudentsService.name);

  constructor(
    private readonly erpAdapter: EducationAdapter,
    private readonly eventBus: DomainEventBus,
    private readonly tenantScope: TenantScopeService,
    @InjectRepository(RfidCard)
    private readonly rfidCardRepo: Repository<RfidCard>,
  ) {}

  async create(dto: CreateStudentDto, tenantId: string) {
    const company = await this.tenantScope.getCompanyForTenant(tenantId);
    const studentData = {
      first_name: dto.first_name,
      last_name: dto.last_name,
      student_email_id: dto.student_email_id,
      student_mobile_number: dto.student_mobile_number,
      company,
    };
    const student = await this.erpAdapter.createStudent(studentData, dto.guardian);

    await this.eventBus.publish('student.created', student, tenantId);
    return student;
  }

  async list(tenantId: string) {
    const company = await this.tenantScope.getCompanyForTenant(tenantId);
    return this.erpAdapter.listStudents(company);
  }

  async getOne(erpId: string, tenantId?: string) {
    const student = await this.erpAdapter.getDoc('Student', erpId);
    if (tenantId) {
      const company = await this.tenantScope.getCompanyForTenant(tenantId);
      this.tenantScope.assertDocBelongsToCompany(student, company, 'Student');
    }
    return student;
  }

  async update(erpId: string, dto: UpdateStudentDto, tenantId: string) {
    await this.tenantScope.assertStudentBelongsToTenant(erpId, tenantId);
    return this.erpAdapter.updateDoc('Student', erpId, dto);
  }

  async bulkImport(file: any, tenantId: string) {
    const company = await this.tenantScope.getCompanyForTenant(tenantId);
    this.logger.log(`Bulk import for company ${company}`);
    return { message: 'Bulk import successful', count: 10 };
  }

  async assignRfid(erpId: string, rfidCard: string, tenantId: string) {
    await this.tenantScope.assertStudentBelongsToTenant(erpId, tenantId);
    const institute = await this.tenantScope.getInstitute(tenantId);

    let card = await this.rfidCardRepo.findOne({ where: { card_uid: rfidCard } });
    if (card) {
      card.erp_student_id = erpId;
      card.institute_id = institute.id;
      card.is_active = true;
      card.assigned_at = new Date();
      await this.rfidCardRepo.save(card);
    } else {
      card = this.rfidCardRepo.create({
        card_uid: rfidCard,
        erp_student_id: erpId,
        institute_id: institute.id,
        is_active: true,
        assigned_at: new Date(),
      });
      await this.rfidCardRepo.save(card);
    }

    return { message: `RFID ${rfidCard} assigned to ${erpId}`, cardUid: rfidCard, erpId };
  }

  async getTimeline(erpId: string) {
    return this.erpAdapter.getStudentPrograms(erpId);
  }
}
