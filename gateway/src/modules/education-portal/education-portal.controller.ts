import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { EducationPortalService } from './education-portal.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { FeatureGuard, RequireFeature } from '../../shared/feature-flags/features';

@ApiTags('Education Portal')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('education')
export class EducationPortalController {
  constructor(private readonly portalService: EducationPortalService) {}

  @Get('parent/children')
  @Roles('parent')
  @ApiOperation({ summary: 'List children linked to guardian' })
  children(@Request() req: any) {
    return this.portalService.getChildrenForParent(req.user);
  }

  @Get('students/:studentId/schedule')
  @Roles('student', 'parent', 'admin', 'instructor')
  schedule(@Param('studentId') studentId: string, @Request() req: any) {
    return this.portalService.getSchedule(studentId, req.user);
  }

  @Get('students/:studentId/attendance')
  @Roles('student', 'parent', 'admin', 'instructor')
  attendance(
    @Param('studentId') studentId: string,
    @Query('studentGroup') studentGroup: string,
    @Request() req: any,
  ) {
    return this.portalService.getAttendance(studentId, studentGroup, req.user);
  }

  @Get('students/:studentId/invoices')
  @Roles('student', 'parent', 'admin')
  invoices(@Param('studentId') studentId: string, @Request() req: any) {
    return this.portalService.getInvoices(studentId, req.user);
  }

  @Get('students/:studentId/programs')
  @Roles('student', 'parent', 'admin', 'instructor')
  programs(@Param('studentId') studentId: string, @Request() req: any) {
    return this.portalService.getPrograms(studentId, req.user);
  }

  @Get('students/:studentId/grades')
  @Roles('student', 'parent', 'admin', 'instructor')
  grades(
    @Param('studentId') studentId: string,
    @Query('program') program: string,
    @Request() req: any,
  ) {
    return this.portalService.getGrades(studentId, program, req.user);
  }

  @Post('students/:studentId/leave')
  @Roles('student', 'parent')
  leave(
    @Param('studentId') studentId: string,
    @Body() body: { from_date: string; to_date: string; reason: string; student_group: string },
    @Request() req: any,
  ) {
    return this.portalService.applyLeave({ ...body, student: studentId }, req.user);
  }

  @Get('leave-requests')
  @Roles('admin')
  @ApiOperation({ summary: 'List leave applications for institute' })
  leaveRequests(@Request() req: any) {
    return this.portalService.listLeaveRequests(req.user.tenantId);
  }

  @Put('leave-requests/:id')
  @Roles('admin')
  @ApiOperation({ summary: 'Approve or reject leave application' })
  updateLeave(
    @Param('id') id: string,
    @Body() body: { status: 'Approved' | 'Rejected' },
    @Request() req: any,
  ) {
    return this.portalService.updateLeaveRequest(id, body.status, req.user.tenantId);
  }

  @Get('instructors')
  @Roles('admin')
  @ApiOperation({ summary: 'List all instructors for institute' })
  instructors(@Request() req: any) {
    return this.portalService.listInstructors(req.user.tenantId);
  }

  @Post('instructors')
  @Roles('admin')
  @ApiOperation({ summary: 'Create instructor' })
  createInstructor(
    @Request() req: any,
    @Body() body: { instructor_name: string; cell_number?: string; email_address?: string },
  ) {
    return this.portalService.createInstructor(body, req.user.tenantId);
  }

  @Put('instructors/:id')
  @Roles('admin')
  @ApiOperation({ summary: 'Deactivate instructor' })
  deactivateInstructor(@Param('id') id: string, @Request() req: any) {
    return this.portalService.deactivateInstructor(id, req.user.tenantId);
  }

  @Post('assessment-results')
  @UseGuards(FeatureGuard)
  @RequireFeature('grades')
  @Roles('admin', 'instructor')
  @ApiOperation({ summary: 'Create assessment result (grade entry)' })
  createAssessmentResult(
    @Body() body: {
      student: string;
      assessment_plan: string;
      program: string;
      course: string;
      total_score: number;
      maximum_score: number;
    },
  ) {
    return this.portalService.createAssessmentResult(body);
  }
}
