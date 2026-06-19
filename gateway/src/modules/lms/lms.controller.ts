import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { LmsService } from './lms.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('LMS')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('lms')
export class LmsController {
  constructor(private readonly lmsService: LmsService) {}

  @Get('courses')
  @Roles('admin', 'instructor', 'student', 'parent')
  @ApiOperation({ summary: 'List Moodle courses' })
  courses() {
    return this.lmsService.listCourses();
  }

  @Get('courses/:courseId/content')
  @Roles('admin', 'instructor', 'student', 'parent')
  @ApiOperation({ summary: 'Get Moodle course contents' })
  content(@Param('courseId') courseId: number) {
    return this.lmsService.getCourseContents(courseId);
  }

  @Get('courses/:courseId/grades')
  @Roles('admin', 'instructor', 'student', 'parent')
  @ApiOperation({ summary: 'Get user grades for course' })
  grades(@Param('courseId') courseId: number, @Query('userId') userId: number) {
    return this.lmsService.getUserGrades(userId, courseId);
  }
}
