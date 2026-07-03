import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';

@Injectable()
export class RfidWebhookGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const secret = this.configService.get<string>('RFID_WEBHOOK_SECRET');
    if (!secret) {
      if (this.configService.get<string>('NODE_ENV') === 'development') {
        return true;
      }
      throw new UnauthorizedException('RFID webhook secret is not configured');
    }

    const request = context.switchToHttp().getRequest();
    const signature = request.headers['x-rfid-signature'] as string | undefined;
    if (!signature) {
      throw new UnauthorizedException('Missing X-RFID-Signature header');
    }

    const rawBody = JSON.stringify(request.body ?? {});
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    const provided = signature.replace(/^sha256=/, '');

    try {
      const valid = timingSafeEqual(
        Buffer.from(expected, 'hex'),
        Buffer.from(provided, 'hex'),
      );
      if (!valid) {
        throw new UnauthorizedException('Invalid RFID webhook signature');
      }
    } catch {
      throw new UnauthorizedException('Invalid RFID webhook signature');
    }

    return true;
  }
}
