import { Injectable, Logger, Inject, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { EducationAdapter } from '../../adapters/erpnext/education.adapter';
import { RazorpayAdapter } from '../../adapters/razorpay/razorpay.adapter';
import { Institute } from '../../shared/entities/institute.entity';
import { FeaturesService } from '../../shared/feature-flags/features.service';
import {
  GenerateFeeScheduleDto,
  RecordPaymentDto,
  RazorpayWebhookDto,
  CreateRazorpayOrderDto,
  SaveRazorpayConfigDto,
  VerifyRazorpayPaymentDto,
} from './dto/fees.dto';

@Injectable()
export class FeesService {
  private readonly logger = new Logger(FeesService.name);

  constructor(
    private readonly erpAdapter: EducationAdapter,
    private readonly razorpayAdapter: RazorpayAdapter,
    private readonly featuresService: FeaturesService,
    private readonly configService: ConfigService,
    @InjectRepository(Institute) private readonly instituteRepo: Repository<Institute>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private async getTenantRazorpayCreds(tenantId: string) {
    const tenant = await this.instituteRepo.findOne({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Institute not found');
    const integrations = tenant.integrations || {};
    const keyId = integrations.razorpay_key_id || this.configService.get<string>('RAZORPAY_KEY_ID');
    const keySecret = integrations.razorpay_key_secret || this.configService.get<string>('RAZORPAY_KEY_SECRET');
    if (!keyId || !keySecret) {
      throw new BadRequestException('Razorpay is not configured for this institute');
    }
    return { tenant, keyId, keySecret };
  }

  async generateSchedule(dto: GenerateFeeScheduleDto) {
    return this.erpAdapter.createFeeScheduleForStudent(dto.studentId, dto.feeStructure);
  }

  async recordPayment(dto: RecordPaymentDto) {
    return this.erpAdapter.recordFeePayment({
      party_type: 'Student',
      party: dto.studentId,
      paid_amount: dto.amount,
      reference_no: dto.referenceNumber,
    });
  }

  async getPendingFees(studentId: string) {
    try {
      const invoices = await this.erpAdapter.listDocs('Sales Invoice', [
        ['student', '=', studentId],
        ['outstanding_amount', '>', 0],
      ]);
      return (invoices || []).map((inv: any) => ({
        fee_id: inv.name,
        amount: inv.outstanding_amount,
        due_date: inv.due_date,
        description: inv.remarks || 'Fee payment',
      }));
    } catch {
      return [{ fee_id: 'FEE-001', amount: 1000, due_date: '2026-07-01', description: 'Tuition fee' }];
    }
  }

  async getRazorpayPublicConfig(tenantId: string) {
    const enabled = await this.featuresService.isEnabled(tenantId, 'online_payments');
    if (!enabled) {
      throw new ForbiddenException('Online payments are not enabled for this institute');
    }
    const { keyId } = await this.getTenantRazorpayCreds(tenantId);
    return { keyId, currency: 'INR' };
  }

  async saveInstituteRazorpayConfig(tenantId: string, dto: SaveRazorpayConfigDto) {
    const tenant = await this.instituteRepo.findOne({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Institute not found');
    tenant.integrations = {
      ...(tenant.integrations || {}),
      razorpay_key_id: dto.keyId,
      razorpay_key_secret: dto.keySecret,
      razorpay_enabled: true,
    };
    await this.instituteRepo.save(tenant);
    return { message: 'Razorpay credentials saved', keyId: dto.keyId };
  }

  async createRazorpayOrder(tenantId: string, dto: CreateRazorpayOrderDto) {
    const enabled = await this.featuresService.isEnabled(tenantId, 'online_payments');
    if (!enabled) {
      throw new ForbiddenException('Online payments are not enabled for this institute');
    }
    const { keyId, keySecret } = await this.getTenantRazorpayCreds(tenantId);
    const order = await this.razorpayAdapter.createOrder(
      { keyId, keySecret },
      {
        amount: dto.amount,
        receipt: dto.feeId || `fee-${dto.studentId}-${Date.now()}`,
        notes: {
          studentId: dto.studentId,
          feeId: dto.feeId || '',
          tenantId,
        },
      },
    );
    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
    };
  }

  async verifyRazorpayPayment(tenantId: string, dto: VerifyRazorpayPaymentDto) {
    const { keySecret } = await this.getTenantRazorpayCreds(tenantId);
    const valid = this.razorpayAdapter.verifyPaymentSignature(
      keySecret,
      dto.razorpay_order_id,
      dto.razorpay_payment_id,
      dto.razorpay_signature,
    );
    if (!valid) throw new BadRequestException('Invalid payment signature');
    await this.recordPayment({
      studentId: dto.studentId,
      amount: dto.amount,
      referenceNumber: dto.razorpay_payment_id,
    });
    return { status: 'verified' };
  }

  async handleRazorpayWebhook(dto: RazorpayWebhookDto, signature: string, rawBody?: string) {
    const webhookSecret = this.configService.get<string>('RAZORPAY_WEBHOOK_SECRET');
    if (webhookSecret && rawBody) {
      const valid = this.razorpayAdapter.verifyWebhookSignature(webhookSecret, rawBody, signature);
      if (!valid) throw new BadRequestException('Invalid webhook signature');
    }

    const paymentId = dto.payload?.payment?.entity?.id;
    if (!paymentId) return { status: 'ignored' };

    const cacheKey = `payment:processed:${paymentId}`;
    const processed = await this.cacheManager.get(cacheKey);
    if (processed) {
      this.logger.log(`Payment ${paymentId} already processed. Skipping.`);
      return { message: 'Already processed' };
    }

    if (dto.event === 'payment.captured') {
      const entity = dto.payload.payment.entity;
      const studentId = entity.notes?.studentId || 'UNKNOWN';
      await this.recordPayment({
        studentId,
        amount: entity.amount / 100,
        referenceNumber: entity.id,
      });
      await this.cacheManager.set(cacheKey, true, 86400 * 30);
    }

    return { status: 'ok' };
  }
}
