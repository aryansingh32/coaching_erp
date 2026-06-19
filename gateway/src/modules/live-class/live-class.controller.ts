import { Controller, Post, Get, Delete, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { LiveClassService } from './live-class.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { FeatureGuard, RequireFeature } from '../../shared/feature-flags/features';

@ApiTags('Live Class')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
@RequireFeature('live_classes')
@Controller('live-class')
export class LiveClassController {
  constructor(private readonly liveClassService: LiveClassService) {}

  @Get()
  @Roles('admin', 'instructor', 'student', 'parent')
  @ApiOperation({ summary: 'List active live classes' })
  list(@Request() req: any, @Query('batchId') batchId?: string) {
    return this.liveClassService.listMeetings(req.user.tenantId, batchId);
  }

  @Post(':batchId/create')
  @Roles('admin', 'instructor')
  @ApiOperation({ summary: 'Create BBB meeting for batch' })
  create(@Param('batchId') batchId: string, @Request() req: any, @Body() body: { name: string }) {
    return this.liveClassService.createMeeting(
      req.user.tenantId,
      batchId,
      body.name || `Class ${batchId}`,
      req.user.userId,
    );
  }

  @Post(':meetingId/join')
  @Roles('admin', 'instructor', 'student', 'parent')
  @ApiOperation({ summary: 'Get BBB join URL' })
  join(
    @Param('meetingId') meetingId: string,
    @Request() req: any,
    @Body() body: { fullName?: string },
  ) {
    const fullName = body.fullName || req.user.userId;
    return this.liveClassService.getJoinUrl(req.user.tenantId, meetingId, fullName, req.user.role);
  }

  @Delete(':meetingId')
  @Roles('admin', 'instructor')
  @ApiOperation({ summary: 'End live class meeting' })
  end(@Param('meetingId') meetingId: string, @Request() req: any) {
    return this.liveClassService.endMeeting(req.user.tenantId, meetingId);
  }

  @Get(':meetingId/recordings')
  @Roles('admin', 'instructor', 'student')
  @RequireFeature('recordings')
  @ApiOperation({ summary: 'Get BBB recordings' })
  recordings(@Param('meetingId') meetingId: string, @Request() req: any) {
    return this.liveClassService.getRecordings(req.user.tenantId, meetingId);
  }
}
