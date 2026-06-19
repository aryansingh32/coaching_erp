import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TestsService } from './tests.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Tests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tests')
export class TestsController {
  constructor(private readonly testsService: TestsService) {}

  @Get()
  @Roles('admin', 'instructor', 'student', 'parent')
  @ApiOperation({ summary: 'List Moodle quizzes by course IDs' })
  list(@Query('courseIds') courseIds: string) {
    const ids = courseIds.split(',').map((id) => parseInt(id, 10)).filter(Boolean);
    return this.testsService.listQuizzes(ids);
  }

  @Post(':quizId/attempt/start')
  @Roles('student', 'instructor', 'admin')
  @ApiOperation({ summary: 'Start Moodle quiz attempt' })
  start(@Param('quizId') quizId: number, @Body() body: { userId?: number }) {
    return this.testsService.startAttempt(quizId, body.userId);
  }

  @Get('attempt/:attemptId/review')
  @Roles('student', 'instructor', 'admin', 'parent')
  @ApiOperation({ summary: 'Get quiz attempt review' })
  review(@Param('attemptId') attemptId: number, @Query('page') page?: number) {
    return this.testsService.getAttemptReview(attemptId, page);
  }

  @Post('attempt/:attemptId/submit')
  @Roles('student', 'instructor', 'admin')
  @ApiOperation({ summary: 'Submit quiz attempt' })
  submit(@Param('attemptId') attemptId: number, @Body() body: { answers: Record<string, string> }) {
    return this.testsService.submitAttempt(attemptId, body.answers || {});
  }
}
