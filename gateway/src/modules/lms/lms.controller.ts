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
    @Body() body: { name: string; type?: string; externalurl?: string; filename?: string; filecontentBase64?: string; intro?: string },
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

  @Post('courses/:courseId/grades')
  @Roles('admin', 'instructor')
  @ApiOperation({ summary: 'Save user grades for course' })
  saveGrades(
    @Request() req: { user: AuthenticatedUser },
    @Param('courseId') courseId: number,
    @Body() body: { grades: { userid: number; grade: number; itemid: number }[] },
  ) {
    return this.lmsService.saveGrades(courseId, body.grades, req.user);
  }

  @Post('assignments/:id/submit')
  @Roles('student')
  @ApiOperation({ summary: 'Submit an assignment' })
  submitAssignment(
    @Request() req: { user: AuthenticatedUser },
    @Param('id') assignmentId: number,
    @Body() body: { fileBase64: string; filename: string },
  ) {
    return this.lmsService.submitAssignment(assignmentId, body.fileBase64, body.filename, req.user);
  }

  @Post('forums/:id/discussions')
  @Roles('admin', 'instructor', 'student')
  @ApiOperation({ summary: 'Add forum discussion' })
  addForumDiscussion(
    @Request() req: { user: AuthenticatedUser },
    @Param('id') forumId: number,
    @Body() body: { subject: string; message: string },
  ) {
    return this.lmsService.addForumDiscussion(forumId, body.subject, body.message, req.user);
  }

  @Post('discussions/:id/replies')
  @Roles('admin', 'instructor', 'student')
  @ApiOperation({ summary: 'Reply to forum discussion' })
  replyDiscussion(
    @Request() req: { user: AuthenticatedUser },
    @Param('id') discussionId: number,
    @Body() body: { message: string },
  ) {
    return this.lmsService.replyToDiscussion(discussionId, body.message, req.user);
  }
}
