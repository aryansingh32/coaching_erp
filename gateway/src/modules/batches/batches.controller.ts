import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { BatchesService } from './batches.service';
import { CreateBatchDto, EnrollStudentDto, ScheduleBatchDto } from './dto/batch.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Batches')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('batches')
export class BatchesController {
  constructor(private readonly batchesService: BatchesService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create Batch' })
  async create(@Body() dto: CreateBatchDto) {
    return this.batchesService.create(dto);
  }

  @Get()
  @Roles('admin', 'instructor')
  @ApiOperation({ summary: 'List Batches' })
  async list() {
    return this.batchesService.list();
  }

  @Get(':id')
  @Roles('admin', 'instructor', 'student')
  @ApiOperation({ summary: 'Get Batch' })
  async getOne(@Param('id') id: string) {
    return this.batchesService.getOne(id);
  }

  @Post(':id/enroll')
  @Roles('admin')
  @ApiOperation({ summary: 'Enroll Student in Batch' })
  async enroll(@Param('id') id: string, @Body() dto: EnrollStudentDto) {
    return this.batchesService.enroll(id, dto);
  }

  @Post(':id/schedule')
  @Roles('admin', 'instructor')
  @ApiOperation({ summary: 'Schedule Batch' })
  async schedule(@Param('id') id: string, @Body() dto: ScheduleBatchDto) {
    return this.batchesService.schedule(id, dto);
  }

  @Post(':id/instructors')
  @Roles('admin')
  @ApiOperation({ summary: 'Assign Instructor to Batch' })
  async assignInstructor(@Param('id') id: string, @Body('instructorId') instructorId: string) {
    return this.batchesService.assignInstructor(id, instructorId);
  }
}
