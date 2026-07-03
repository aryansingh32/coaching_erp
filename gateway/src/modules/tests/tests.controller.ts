import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TestsService } from './tests.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { FeatureGuard, RequireFeature } from '../../shared/feature-flags/features';
import { AuthenticatedUser } from '../../shared/tenant/tenant.types';

@ApiTags('Tests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
@RequireFeature('online_tests')
@Controller('tests')
export class TestsController {
  constructor(private readonly testsService: TestsService) {}

  @Get()
  @Roles('admin', 'instructor', 'student', 'parent')
  @ApiOperation({ summary: 'List Moodle quizzes by course IDs' })
  list(
    @Request() req: { user: AuthenticatedUser },
    @Query('courseIds') courseIds: string,
  ) {
    const ids = courseIds.split(',').map((id) => parseInt(id, 10)).filter(Boolean);
    return this.testsService.listQuizzes(ids, req.user);
  }

  @Post('quizzes')
  @Roles('admin', 'instructor')
  @ApiOperation({ summary: 'Create Moodle quiz in a course' })
  createQuiz(
    @Request() req: { user: AuthenticatedUser },
    @Body() body: { courseId: number; name: string; intro?: string },
  ) {
    return this.testsService.createQuiz(body.courseId, body.name, body.intro, req.user);
  }

  @Post(':quizId/attempt/start')
  @Roles('student', 'instructor', 'admin')
  @ApiOperation({ summary: 'Start Moodle quiz attempt' })
  start(
    @Request() req: { user: AuthenticatedUser },
    @Param('quizId') quizId: number,
    @Body() body: { userId?: number },
  ) {
    return this.testsService.startAttempt(quizId, body.userId, req.user);
  }

  @Get('attempt/:attemptId/data')
  @Roles('student', 'instructor', 'admin')
  @ApiOperation({ summary: 'Get in-progress quiz attempt questions' })
  attemptData(
    @Request() req: { user: AuthenticatedUser },
    @Param('attemptId') attemptId: number,
    @Query('page') page?: number,
  ) {
    return this.testsService.getAttemptData(attemptId, page, req.user);
  }

  @Get('attempt/:attemptId/review')
  @Roles('student', 'instructor', 'admin', 'parent')
  @ApiOperation({ summary: 'Get quiz attempt review' })
  review(
    @Request() req: { user: AuthenticatedUser },
    @Param('attemptId') attemptId: number,
    @Query('page') page?: number,
  ) {
    return this.testsService.getAttemptReview(attemptId, page, req.user);
  }

  @Post('attempt/:attemptId/submit')
  @Roles('student', 'instructor', 'admin')
  @ApiOperation({ summary: 'Submit quiz attempt' })
  submit(
    @Request() req: { user: AuthenticatedUser },
    @Param('attemptId') attemptId: number,
    @Body() body: { answers: Record<string, string> },
  ) {
    return this.testsService.submitAttempt(attemptId, body.answers || {}, req.user);
  }
}
