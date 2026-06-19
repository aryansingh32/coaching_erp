import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BbbAdapter } from '../../adapters/bbb/bbb.adapter';
import { LiveMeeting } from '../../shared/entities/live-meeting.entity';
import { FeaturesService } from '../../shared/feature-flags/features.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LiveClassService {
  private readonly logger = new Logger(LiveClassService.name);

  constructor(
    private readonly bbbAdapter: BbbAdapter,
    private readonly featuresService: FeaturesService,
    @InjectRepository(LiveMeeting) private readonly meetingRepo: Repository<LiveMeeting>,
  ) {}

  private async assertLiveClassesEnabled(tenantId: string) {
    const enabled = await this.featuresService.isEnabled(tenantId, 'live_classes');
    if (!enabled) {
      throw new NotFoundException('Live classes are not enabled for this institute');
    }
  }

  async createMeeting(tenantId: string, batchId: string, name: string, createdBy?: string) {
    await this.assertLiveClassesEnabled(tenantId);
    const meetingId = `batch-${batchId}-${uuidv4().slice(0, 8)}`;
    const attendeePw = uuidv4().slice(0, 8);
    const moderatorPw = uuidv4().slice(0, 8);
    await this.bbbAdapter.createMeeting(meetingId, name, attendeePw, moderatorPw);
    const meeting = this.meetingRepo.create({
      meeting_id: meetingId,
      batch_id: batchId,
      tenant_id: tenantId,
      name,
      attendee_pw: attendeePw,
      moderator_pw: moderatorPw,
      status: 'active',
      created_by: createdBy,
    });
    await this.meetingRepo.save(meeting);
    return { meetingId, batchId, name };
  }

  async listMeetings(tenantId: string, batchId?: string) {
    const where: Record<string, string> = { tenant_id: tenantId, status: 'active' };
    if (batchId) where.batch_id = batchId;
    const meetings = await this.meetingRepo.find({ where, order: { created_at: 'DESC' } });
    return meetings.map((m) => ({
      meetingId: m.meeting_id,
      batchId: m.batch_id,
      name: m.name,
      createdAt: m.created_at,
    }));
  }

  async getJoinUrl(tenantId: string, meetingId: string, fullName: string, role: string) {
    await this.assertLiveClassesEnabled(tenantId);
    const meeting = await this.meetingRepo.findOne({
      where: { meeting_id: meetingId, tenant_id: tenantId, status: 'active' },
    });
    if (!meeting) throw new NotFoundException('Meeting not found');
    const password =
      role === 'instructor' || role === 'admin' ? meeting.moderator_pw : meeting.attendee_pw;
    const joinUrl = this.bbbAdapter.getJoinUrl(meetingId, fullName, password);
    return { joinUrl, meetingId, role, name: meeting.name };
  }

  async endMeeting(tenantId: string, meetingId: string) {
    const meeting = await this.meetingRepo.findOne({
      where: { meeting_id: meetingId, tenant_id: tenantId },
    });
    if (!meeting) throw new NotFoundException('Meeting not found');
    await this.bbbAdapter.endMeeting(meetingId, meeting.moderator_pw);
    meeting.status = 'ended';
    await this.meetingRepo.save(meeting);
    return { message: 'Meeting ended' };
  }

  async getRecordings(tenantId: string, meetingId: string) {
    await this.assertLiveClassesEnabled(tenantId);
    return this.bbbAdapter.getRecordings(meetingId);
  }
}
