import { Controller, Post, Get, Body, Param, Headers } from '@nestjs/common';
import { FeesService } from './fees.service';
import { GenerateFeeScheduleDto, RecordPaymentDto, RazorpayWebhookDto } from './dto/fees.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Fees')
@Controller('fees')
export class FeesController {
  constructor(private readonly feesService: FeesService) {}

  @Post('schedule')
  @ApiOperation({ summary: 'Generate Fee Schedule' })
  async generateSchedule(@Body() dto: GenerateFeeScheduleDto) {
    return this.feesService.generateSchedule(dto);
  }

  @Post('payment')
  @ApiOperation({ summary: 'Record Manual Payment' })
  async recordPayment(@Body() dto: RecordPaymentDto) {
    return this.feesService.recordPayment(dto);
  }

  @Get('pending/:studentId')
  @ApiOperation({ summary: 'Get Pending Fees' })
  async getPendingFees(@Param('studentId') studentId: string) {
    return this.feesService.getPendingFees(studentId);
  }

  @Post('webhook/razorpay')
  @ApiOperation({ summary: 'Razorpay Webhook' })
  async razorpayWebhook(
    @Headers('x-razorpay-signature') signature: string,
    @Body() dto: RazorpayWebhookDto
  ) {
    return this.feesService.handleRazorpayWebhook(dto, signature);
  }
}
