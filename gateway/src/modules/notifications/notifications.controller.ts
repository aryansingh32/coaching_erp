import { Controller, Get, Put, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthenticatedUser } from '../../shared/tenant/tenant.types';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('logs')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Get notification logs' })
  async getLogs(@Query() query: { tenant?: string; event?: string }) {
    return this.notificationsService.getLogs(query);
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get notification preferences' })
  async getPreferences(@Request() req: { user: AuthenticatedUser }) {
    return this.notificationsService.getPreferences(req.user.userId);
  }

  @Put('preferences')
  @ApiOperation({ summary: 'Update notification preferences' })
  async updatePreferences(
    @Request() req: { user: AuthenticatedUser },
    @Body() body: any,
  ) {
    return this.notificationsService.updatePreferences(req.user.userId, body);
  }
}
