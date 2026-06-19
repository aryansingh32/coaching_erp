import { Controller, Post, Get, Body, Param, Headers, UseGuards, Request, Req } from '@nestjs/common';
import { FeesService } from './fees.service';
import {
  GenerateFeeScheduleDto,
  RecordPaymentDto,
  RazorpayWebhookDto,
  CreateRazorpayOrderDto,
  SaveRazorpayConfigDto,
  VerifyRazorpayPaymentDto,
} from './dto/fees.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { FeatureGuard, RequireFeature } from '../../shared/feature-flags/features';
import { Request as ExpressRequest } from 'express';

@ApiTags('Fees')
@Controller('fees')
export class FeesController {
  constructor(private readonly feesService: FeesService) {}

  @Post('schedule')
  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @RequireFeature('fees_management')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate Fee Schedule' })
  async generateSchedule(@Body() dto: GenerateFeeScheduleDto) {
    return this.feesService.generateSchedule(dto);
  }

  @Post('payment')
  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @RequireFeature('fees_management')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Record Manual Payment' })
  async recordPayment(@Body() dto: RecordPaymentDto) {
    return this.feesService.recordPayment(dto);
  }

  @Get('pending/:studentId')
  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @RequireFeature('fees_management')
  @Roles('admin', 'student', 'parent')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Pending Fees' })
  async getPendingFees(@Param('studentId') studentId: string) {
    return this.feesService.getPendingFees(studentId);
  }

  @Get('razorpay/config')
  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @RequireFeature('online_payments')
  @Roles('admin', 'student', 'parent')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Razorpay public key for checkout' })
  async razorpayConfig(@Request() req: any) {
    return this.feesService.getRazorpayPublicConfig(req.user.tenantId);
  }

  @Post('razorpay/config')
  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @RequireFeature('online_payments')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Save institute Razorpay credentials' })
  async saveRazorpayConfig(@Request() req: any, @Body() dto: SaveRazorpayConfigDto) {
    return this.feesService.saveInstituteRazorpayConfig(req.user.tenantId, dto);
  }

  @Post('razorpay/order')
  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @RequireFeature('online_payments')
  @Roles('student', 'parent', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Razorpay order' })
  async createOrder(@Request() req: any, @Body() dto: CreateRazorpayOrderDto) {
    return this.feesService.createRazorpayOrder(req.user.tenantId, dto);
  }

  @Post('razorpay/verify')
  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @RequireFeature('online_payments')
  @Roles('student', 'parent', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify Razorpay payment signature' })
  async verifyPayment(@Request() req: any, @Body() dto: VerifyRazorpayPaymentDto) {
    return this.feesService.verifyRazorpayPayment(req.user.tenantId, dto);
  }

  @Post('webhook/razorpay')
  @ApiOperation({ summary: 'Razorpay Webhook' })
  async razorpayWebhook(
    @Headers('x-razorpay-signature') signature: string,
    @Body() dto: RazorpayWebhookDto,
    @Req() req: ExpressRequest & { rawBody?: string },
  ) {
    const rawBody = typeof req.rawBody === 'string' ? req.rawBody : JSON.stringify(dto);
    return this.feesService.handleRazorpayWebhook(dto, signature, rawBody);
  }
}
