import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EducationAdapter } from '../../adapters/erpnext/education.adapter';
import { RfidPunchDto, ManualAttendanceDto } from './dto/attendance.dto';

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(
    private readonly erpAdapter: EducationAdapter,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async processRfidPunch(dto: RfidPunchDto) {
    // 1. Resolve RFID to Student
    // (mock resolution)
    const studentId = 'STU-001';
    
    // 2. Mark attendance via ERPNext adapter
    const today = new Date().toISOString().split('T')[0];
    const record = await this.erpAdapter.markStudentAttendance(studentId, today, 'Present', 'Default Group');

    // 3. Emit real-time event
    this.eventEmitter.emit('attendance.marked', {
      studentId,
      time: new Date(),
      status: 'Present'
    });

    return record;
  }

  async markManual(dto: ManualAttendanceDto) {
    const record = await this.erpAdapter.markStudentAttendance(dto.studentId, dto.date, dto.status, dto.batchId);
    
    this.eventEmitter.emit('attendance.marked', {
      studentId: dto.studentId,
      time: dto.date,
      status: dto.status
    });

    return record;
  }

  async getReports(batchId: string, startDate: string, endDate: string) {
    return [{ date: startDate, present: 10, absent: 2 }];
  }
}
