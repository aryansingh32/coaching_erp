import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class MetabaseAdapter {
  private readonly logger = new Logger(MetabaseAdapter.name);
  private readonly url: string;
  private readonly secretKey: string;

  constructor(private readonly configService: ConfigService) {
    this.url = this.configService.get<string>('METABASE_URL');
    this.secretKey = this.configService.get<string>('METABASE_SECRET_KEY');
  }

  generateEmbedToken(dashboardId: number, tenantId: string): string {
    const payload = {
      resource: { dashboard: dashboardId },
      params: { tenant_id: tenantId },
      exp: Math.round(Date.now() / 1000) + (10 * 60) // 10 minute expiration
    };

    const token = jwt.sign(payload, this.secretKey);
    return `${this.url}/embed/dashboard/${token}#bordered=true&titled=true`;
  }
}
