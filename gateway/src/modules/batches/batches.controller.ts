import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { BatchesService } from './batches.service';
import { CreateBatchDto, EnrollStudentDto, ScheduleBatchDto } from './dto/batch.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Batches')
@Controller('batches')
export class BatchesController {
  constructor(private readonly batchesService: BatchesService) {}

  @Post()
  @ApiOperation({ summary: 'Create Batch' })
  async create(@Body() dto: CreateBatchDto) {
    return this.batchesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List Batches' })
  async list() {
    return this.batchesService.list();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Batch' })
  async getOne(@Param('id') id: string) {
    return this.batchesService.getOne(id);
  }

  @Post(':id/enroll')
  @ApiOperation({ summary: 'Enroll Student in Batch' })
  async enroll(@Param('id') id: string, @Body() dto: EnrollStudentDto) {
    return this.batchesService.enroll(id, dto);
  }

  @Post(':id/schedule')
  @ApiOperation({ summary: 'Schedule Batch' })
  async schedule(@Param('id') id: string, @Body() dto: ScheduleBatchDto) {
    return this.batchesService.schedule(id, dto);
  }

  @Post(':id/instructors')
  @ApiOperation({ summary: 'Assign Instructor to Batch' })
  async assignInstructor(@Param('id') id: string, @Body('instructorId') instructorId: string) {
    return this.batchesService.assignInstructor(id, instructorId);
  }
}
