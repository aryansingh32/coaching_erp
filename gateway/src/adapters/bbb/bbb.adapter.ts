import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';
import * as xml2js from 'xml2js';

export interface LiveClassAdapter {
  createMeeting(meetingId: string, name: string, attendeePw: string, moderatorPw: string): Promise<any>;
  getJoinUrl(meetingId: string, fullName: string, password: string): string;
  endMeeting(meetingId: string, moderatorPw: string): Promise<any>;
  getRecordings(meetingId: string): Promise<any>;
  createWebhook(callbackUrl: string): Promise<any>;
}

@Injectable()
export class BbbAdapter implements LiveClassAdapter {
  private readonly logger = new Logger(BbbAdapter.name);
  private readonly apiUrl: string;
  private readonly secret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.apiUrl = this.configService.get<string>('BBB_URL') + '/bigbluebutton/api/';
    this.secret = this.configService.get<string>('BBB_SECRET');
  }

  private generateChecksum(callName: string, query: string): string {
    return crypto.createHash('sha256').update(callName + query + this.secret).digest('hex');
  }

  private async callApi(callName: string, params: Record<string, any> = {}): Promise<any> {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => searchParams.append(key, params[key]));
    
    const query = searchParams.toString();
    const checksum = this.generateChecksum(callName, query);
    
    const url = `${this.apiUrl}${callName}?${query}&checksum=${checksum}`;
    const response = await firstValueFrom(this.httpService.get(url));
    const parser = new xml2js.Parser({ explicitArray: false });
    const result = await parser.parseStringPromise(response.data);
    
    if (result.response.returncode === 'FAILED') {
      throw new Error(`BBB Error: ${result.response.message}`);
    }
    return result.response;
  }

  async createMeeting(meetingId: string, name: string, attendeePw: string, moderatorPw: string): Promise<any> {
    return this.callApi('create', {
      meetingID: meetingId,
      name,
      attendeePW: attendeePw,
      moderatorPW: moderatorPw,
      record: 'true'
    });
  }

  getJoinUrl(meetingId: string, fullName: string, password: string): string {
    const params = new URLSearchParams({ meetingID: meetingId, fullName, password });
    const query = params.toString();
    const checksum = this.generateChecksum('join', query);
    return `${this.apiUrl}join?${query}&checksum=${checksum}`;
  }

  async endMeeting(meetingId: string, moderatorPw: string): Promise<any> {
    return this.callApi('end', { meetingID: meetingId, password: moderatorPw });
  }

  async getRecordings(meetingId: string): Promise<any> {
    return this.callApi('getRecordings', { meetingID: meetingId });
  }

  async createWebhook(callbackUrl: string): Promise<any> {
    return this.callApi('hooks/create', { callbackURL: callbackUrl });
  }
}
