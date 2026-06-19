import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';

export interface RazorpayCredentials {
  keyId: string;
  keySecret: string;
}

export interface CreateOrderParams {
  amount: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}

@Injectable()
export class RazorpayAdapter {
  private readonly logger = new Logger(RazorpayAdapter.name);
  private readonly baseUrl = 'https://api.razorpay.com/v1';

  constructor(private readonly httpService: HttpService) {}

  private authHeader(creds: RazorpayCredentials) {
    const token = Buffer.from(`${creds.keyId}:${creds.keySecret}`).toString('base64');
    return { Authorization: `Basic ${token}` };
  }

  async createOrder(creds: RazorpayCredentials, params: CreateOrderParams) {
    const response = await firstValueFrom(
      this.httpService.post(
        `${this.baseUrl}/orders`,
        {
          amount: Math.round(params.amount * 100),
          currency: params.currency || 'INR',
          receipt: params.receipt,
          notes: params.notes || {},
        },
        { headers: { ...this.authHeader(creds), 'Content-Type': 'application/json' } },
      ),
    );
    return response.data;
  }

  verifyPaymentSignature(
    keySecret: string,
    orderId: string,
    paymentId: string,
    signature: string,
  ): boolean {
    const expected = crypto
      .createHmac('sha256', keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    return expected === signature;
  }

  verifyWebhookSignature(webhookSecret: string, body: string, signature: string): boolean {
    const expected = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');
    return expected === signature;
  }
}
