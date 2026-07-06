import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DomainEventBus } from '../../shared/events/domain-event-bus';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EducationAdapter } from '../../adapters/erpnext/education.adapter';
import { RfidCard } from '../../shared/entities/rfid-card.entity';
import { TenantScopeService } from '../../shared/tenant/tenant-scope.service';
import { FeaturesService } from '../../shared/feature-flags/features.service';
import { RfidPunchDto, ManualAttendanceDto } from './dto/attendance.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(
    private readonly erpAdapter: EducationAdapter,
    private readonly eventBus: DomainEventBus,
    private readonly tenantScope: TenantScopeService,
    private readonly featuresService: FeaturesService,
    @InjectRepository(RfidCard)
    private readonly rfidCardRepo: Repository<RfidCard>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async processRfidPunch(dto: RfidPunchDto) {
    const card = await this.rfidCardRepo.findOne({
      where: { card_uid: dto.rfidCard, is_active: true },
    });
    if (!card?.erp_student_id) {
      throw new NotFoundException('RFID card not registered or not assigned to a student');
    }

    const enabled = await this.featuresService.isEnabled(card.institute_id, 'attendance_rfid');
    if (!enabled) {
      throw new ForbiddenException('RFID attendance is not enabled for this institute');
    }

    const company = await this.tenantScope.getCompanyForTenant(card.institute_id);
    const student = await this.erpAdapter.getDoc('Student', card.erp_student_id);
    this.tenantScope.assertDocBelongsToCompany(student, company, 'Student');

    const today = new Date().toISOString().split('T')[0];
    const studentGroup = student.student_group || student.default_student_group || 'Default Group';
    const record = await this.erpAdapter.markStudentAttendance(
      card.erp_student_id,
      today,
      'Present',
      studentGroup,
    );

    await this.eventBus.publish('attendance.marked', {
      studentId: card.erp_student_id,
      instituteId: card.institute_id,
      deviceId: dto.deviceId,
      time: new Date(),
      status: 'Present',
    }, card.institute_id);

    await this.notificationsService.triggerEvent('attendance-punch', card.erp_student_id, {
      status: 'Present',
      date: today,
    });

    return record;
  }

  async markManual(dto: ManualAttendanceDto, tenantId: string) {
    await this.tenantScope.assertStudentBelongsToTenant(dto.studentId, tenantId);
    await this.tenantScope.assertBatchBelongsToTenant(dto.batchId, tenantId);

    const record = await this.erpAdapter.markStudentAttendance(
      dto.studentId,
      dto.date,
      dto.status,
      dto.batchId,
    );

    await this.eventBus.publish('attendance.marked', {
      studentId: dto.studentId,
      time: dto.date,
      status: dto.status,
    }, tenantId);

    await this.notificationsService.triggerEvent('attendance-punch', dto.studentId, {
      status: dto.status,
      date: dto.date,
    });

    return record;
  }

  async getReports(batchId: string, startDate: string, endDate: string, tenantId: string) {
    await this.tenantScope.assertBatchBelongsToTenant(batchId, tenantId);
    const records = await this.erpAdapter.listDocs(
      'Student Attendance',
      [
        ['student_group', '=', batchId],
        ['date', '>=', startDate],
        ['date', '<=', endDate],
      ],
      ['student', 'student_name', 'date', 'status'],
    );
    return records;
  }
}
