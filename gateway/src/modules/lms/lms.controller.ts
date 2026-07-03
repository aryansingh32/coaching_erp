import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { LmsService } from './lms.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { FeatureGuard, RequireFeature } from '../../shared/feature-flags/features';
import { AuthenticatedUser } from '../../shared/tenant/tenant.types';

@ApiTags('LMS')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
@RequireFeature('moodle_lms')
@Controller('lms')
export class LmsController {
  constructor(private readonly lmsService: LmsService) {}

  @Get('courses')
  @Roles('admin', 'instructor', 'student', 'parent')
  @ApiOperation({ summary: 'List Moodle courses' })
  courses(@Request() req: { user: AuthenticatedUser }) {
    return this.lmsService.listCourses(req.user);
  }

  @Post('courses')
  @Roles('admin', 'instructor')
  @ApiOperation({ summary: 'Create Moodle course' })
  createCourse(
    @Request() req: { user: AuthenticatedUser },
    @Body() body: { fullname: string; shortname: string; categoryid?: number },
  ) {
    return this.lmsService.createCourse(req.user, body);
  }

  @Get('courses/:courseId/content')
  @Roles('admin', 'instructor', 'student', 'parent')
  @ApiOperation({ summary: 'Get Moodle course contents' })
  content(
    @Request() req: { user: AuthenticatedUser },
    @Param('courseId') courseId: number,
  ) {
    return this.lmsService.getCourseContents(courseId, req.user);
  }

  @Post('courses/:courseId/content')
  @Roles('admin', 'instructor')
  @ApiOperation({ summary: 'Add content module to Moodle course' })
  addContent(
    @Request() req: { user: AuthenticatedUser },
    @Param('courseId') courseId: number,
    @Body() body: { name: string; externalurl?: string; filename?: string; filecontentBase64?: string },
  ) {
    return this.lmsService.addCourseContent(courseId, req.user, body);
  }

  @Get('courses/:courseId/grades')
  @Roles('admin', 'instructor', 'student', 'parent')
  @ApiOperation({ summary: 'Get user grades for course' })
  grades(
    @Request() req: { user: AuthenticatedUser },
    @Param('courseId') courseId: number,
    @Query('userId') userId: number,
  ) {
    return this.lmsService.getUserGrades(userId, courseId, req.user);
  }
}
