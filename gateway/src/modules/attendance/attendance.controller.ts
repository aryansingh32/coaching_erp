import { Controller, Post, Get, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { RfidPunchDto, ManualAttendanceDto } from './dto/attendance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { FeatureGuard, RequireFeature } from '../../shared/feature-flags/features';
import { RfidWebhookGuard } from './guards/rfid-webhook.guard';
import { AuthenticatedUser } from '../../shared/tenant/tenant.types';

@ApiTags('Attendance')
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('rfid-punch')
  @UseGuards(RfidWebhookGuard)
  @ApiOperation({ summary: 'Process RFID punch (hardware webhook)' })
  @ApiHeader({ name: 'X-RFID-Signature', description: 'HMAC-SHA256 of request body' })
  async rfidPunch(@Body() dto: RfidPunchDto) {
    return this.attendanceService.processRfidPunch(dto);
  }

  @Post('manual')
  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @RequireFeature('attendance_manual')
  @Roles('admin', 'instructor')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark manual attendance' })
  async markManual(
    @Request() req: { user: AuthenticatedUser },
    @Body() dto: ManualAttendanceDto,
  ) {
    return this.attendanceService.markManual(dto, req.user.tenantId!);
  }

  @Get('reports')
  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @RequireFeature('attendance_manual')
  @Roles('admin', 'instructor')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get attendance reports for a batch' })
  async getReports(
    @Request() req: { user: AuthenticatedUser },
    @Query('batchId') batchId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.attendanceService.getReports(batchId, startDate, endDate, req.user.tenantId!);
  }
}
