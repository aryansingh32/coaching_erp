import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { RfidPunchDto, ManualAttendanceDto } from './dto/attendance.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Attendance')
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('rfid-punch')
  @ApiOperation({ summary: 'Process RFID Punch' })
  async rfidPunch(@Body() dto: RfidPunchDto) {
    return this.attendanceService.processRfidPunch(dto);
  }

  @Post('manual')
  @ApiOperation({ summary: 'Mark Manual Attendance' })
  async markManual(@Body() dto: ManualAttendanceDto) {
    return this.attendanceService.markManual(dto);
  }

  @Get('reports')
  @ApiOperation({ summary: 'Get Attendance Reports' })
  async getReports(
    @Query('batchId') batchId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    return this.attendanceService.getReports(batchId, startDate, endDate);
  }
}
