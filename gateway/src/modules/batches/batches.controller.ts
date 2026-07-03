import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { BatchesService } from './batches.service';
import { CreateBatchDto, EnrollStudentDto, ScheduleBatchDto } from './dto/batch.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthenticatedUser } from '../../shared/tenant/tenant.types';

@ApiTags('Batches')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('batches')
export class BatchesController {
  constructor(private readonly batchesService: BatchesService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create Batch' })
  async create(@Request() req: { user: AuthenticatedUser }, @Body() dto: CreateBatchDto) {
    return this.batchesService.create(dto, req.user.tenantId!);
  }

  @Get()
  @Roles('admin', 'instructor')
  @ApiOperation({ summary: 'List Batches' })
  async list(@Request() req: { user: AuthenticatedUser }) {
    return this.batchesService.list(req.user.tenantId!);
  }

  @Get(':id')
  @Roles('admin', 'instructor', 'student')
  @ApiOperation({ summary: 'Get Batch' })
  async getOne(@Request() req: { user: AuthenticatedUser }, @Param('id') id: string) {
    return this.batchesService.getOne(id, req.user.tenantId!);
  }

  @Post(':id/enroll')
  @Roles('admin')
  @ApiOperation({ summary: 'Enroll Student in Batch' })
  async enroll(
    @Request() req: { user: AuthenticatedUser },
    @Param('id') id: string,
    @Body() dto: EnrollStudentDto,
  ) {
    return this.batchesService.enroll(id, dto, req.user.tenantId!);
  }

  @Post(':id/schedule')
  @Roles('admin', 'instructor')
  @ApiOperation({ summary: 'Schedule Batch' })
  async schedule(
    @Request() req: { user: AuthenticatedUser },
    @Param('id') id: string,
    @Body() dto: ScheduleBatchDto,
  ) {
    return this.batchesService.schedule(id, dto, req.user.tenantId!);
  }

  @Post(':id/instructors')
  @Roles('admin')
  @ApiOperation({ summary: 'Assign Instructor to Batch' })
  async assignInstructor(
    @Request() req: { user: AuthenticatedUser },
    @Param('id') id: string,
    @Body('instructorId') instructorId: string,
  ) {
    return this.batchesService.assignInstructor(id, instructorId, req.user.tenantId!);
  }

  @Get(':id/students')
  @Roles('admin', 'instructor')
  @ApiOperation({ summary: 'List students enrolled in batch' })
  async students(@Request() req: { user: AuthenticatedUser }, @Param('id') id: string) {
    return this.batchesService.getStudents(id, req.user.tenantId!);
  }
}
