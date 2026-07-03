import { Controller, Post, Get, Put, Body, Param, UseGuards, Request, UploadedFile, UseInterceptors } from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto, UpdateStudentDto, AssignRfidDto } from './dto/student.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthenticatedUser } from '../../shared/tenant/tenant.types';

import { FeatureGuard, RequireFeature } from '../../shared/feature-flags/features';

@ApiTags('Students')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create Student' })
  async create(@Request() req: { user: AuthenticatedUser }, @Body() dto: CreateStudentDto) {
    return this.studentsService.create(dto, req.user.tenantId!);
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'List Students' })
  async list(@Request() req: { user: AuthenticatedUser }) {
    return this.studentsService.list(req.user.tenantId!);
  }

  @Get(':erpId')
  @Roles('admin', 'student')
  @ApiOperation({ summary: 'Get Student Details' })
  async getOne(@Request() req: { user: AuthenticatedUser }, @Param('erpId') erpId: string) {
    const tenantId =
      req.user.role === 'admin' ? req.user.tenantId : undefined;
    return this.studentsService.getOne(erpId, tenantId);
  }

  @Put(':erpId')
  @Roles('admin')
  @ApiOperation({ summary: 'Update Student' })
  async update(
    @Request() req: { user: AuthenticatedUser },
    @Param('erpId') erpId: string,
    @Body() dto: UpdateStudentDto,
  ) {
    return this.studentsService.update(erpId, dto, req.user.tenantId!);
  }

  @Post('bulk-import')
  @UseGuards(FeatureGuard)
  @RequireFeature('bulk_import')
  @Roles('admin')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Bulk Import Students' })
  async bulkImport(
    @Request() req: { user: AuthenticatedUser },
    @UploadedFile() file: any,
  ) {
    return this.studentsService.bulkImport(file, req.user.tenantId!);
  }

  @Post(':erpId/rfid-card')
  @UseGuards(FeatureGuard)
  @RequireFeature('attendance_rfid')
  @Roles('admin')
  @ApiOperation({ summary: 'Assign RFID' })
  async assignRfid(
    @Request() req: { user: AuthenticatedUser },
    @Param('erpId') erpId: string,
    @Body() dto: AssignRfidDto,
  ) {
    return this.studentsService.assignRfid(erpId, dto.rfidCard, req.user.tenantId!);
  }

  @Get(':erpId/timeline')
  @Roles('admin', 'student', 'parent')
  @ApiOperation({ summary: 'Get Student Timeline' })
  async getTimeline(@Param('erpId') erpId: string) {
    return this.studentsService.getTimeline(erpId);
  }
}
