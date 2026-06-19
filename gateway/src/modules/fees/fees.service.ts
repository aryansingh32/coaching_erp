import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { EducationAdapter } from '../../adapters/erpnext/education.adapter';
import { GenerateFeeScheduleDto, RecordPaymentDto, RazorpayWebhookDto } from './dto/fees.dto';

@Injectable()
export class FeesService {
  private readonly logger = new Logger(FeesService.name);

  constructor(
    private readonly erpAdapter: EducationAdapter,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async generateSchedule(dto: GenerateFeeScheduleDto) {
    return this.erpAdapter.createFeeScheduleForStudent(dto.studentId, dto.feeStructure);
  }

  async recordPayment(dto: RecordPaymentDto) {
    return this.erpAdapter.recordFeePayment({
      party_type: 'Student',
      party: dto.studentId,
      paid_amount: dto.amount,
      reference_no: dto.referenceNumber
    });
  }

  async getPendingFees(studentId: string) {
    return [{ fee_id: 'FEE-001', amount: 1000, due_date: '2026-07-01' }];
  }

  async handleRazorpayWebhook(dto: RazorpayWebhookDto, signature: string) {
    // Basic idempotency check
    const paymentId = dto.payload?.payment?.entity?.id;
    if (!paymentId) return;

    const cacheKey = `payment:processed:${paymentId}`;
    const processed = await this.cacheManager.get(cacheKey);

    if (processed) {
      this.logger.log(`Payment ${paymentId} already processed. Skipping.`);
      return { message: 'Already processed' };
    }

    // Verify signature logic would be here
    
    // Process payment
    if (dto.event === 'payment.captured') {
      const entity = dto.payload.payment.entity;
      // Record in ERPNext
      // Assuming entity.notes.studentId is set during order creation
      const studentId = entity.notes?.studentId || 'UNKNOWN';
      await this.recordPayment({
        studentId,
        amount: entity.amount / 100, // convert paise to INR
        referenceNumber: entity.id
      });
      
      await this.cacheManager.set(cacheKey, true, 86400 * 30); // 30 days idempotency
    }

    return { status: 'ok' };
  }
}
