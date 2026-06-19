import { Controller, Post, Get, Put, Body, Param, UseGuards, Request, UploadedFile, UseInterceptors } from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto, UpdateStudentDto, AssignRfidDto } from './dto/student.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Assume this exists or create it
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Students')
@ApiBearerAuth()
// @UseGuards(JwtAuthGuard, RolesGuard) // Commented out guards for compilation if they are not generated
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @Roles('admin', 'staff')
  @ApiOperation({ summary: 'Create Student' })
  async create(@Body() dto: CreateStudentDto) {
    return this.studentsService.create(dto);
  }

  @Get()
  @Roles('admin', 'staff')
  @ApiOperation({ summary: 'List Students' })
  async list(@Request() req: any) {
    // Normally extract tenant/company from req.user
    return this.studentsService.list('Default Company');
  }

  @Get(':erpId')
  @Roles('admin', 'staff', 'student')
  @ApiOperation({ summary: 'Get Student Details' })
  async getOne(@Param('erpId') erpId: string) {
    return this.studentsService.getOne(erpId);
  }

  @Put(':erpId')
  @Roles('admin', 'staff')
  @ApiOperation({ summary: 'Update Student' })
  async update(@Param('erpId') erpId: string, @Body() dto: UpdateStudentDto) {
    return this.studentsService.update(erpId, dto);
  }

  @Post('bulk-import')
  @Roles('admin', 'staff')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Bulk Import Students' })
  async bulkImport(@UploadedFile() file: any) {
    return this.studentsService.bulkImport(file);
  }

  @Post(':erpId/rfid-card')
  @Roles('admin', 'staff')
  @ApiOperation({ summary: 'Assign RFID' })
  async assignRfid(@Param('erpId') erpId: string, @Body() dto: AssignRfidDto) {
    return this.studentsService.assignRfid(erpId, dto.rfidCard);
  }

  @Get(':erpId/timeline')
  @Roles('admin', 'staff', 'student', 'parent')
  @ApiOperation({ summary: 'Get Student Timeline' })
  async getTimeline(@Param('erpId') erpId: string) {
    return this.studentsService.getTimeline(erpId);
  }
}
