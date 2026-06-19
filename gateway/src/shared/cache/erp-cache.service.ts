import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';

@Injectable()
export class ErpCacheService {
  constructor(private readonly redisService: RedisService) {}

  // TTL in seconds
  private readonly TTL_STUDENT = 15 * 60; // 15 mins
  private readonly TTL_BATCH = 30 * 60; // 30 mins
  private readonly TTL_ATTENDANCE = 60; // 1 min
  private readonly TTL_INSTITUTE_CONFIG = 60 * 60; // 1 hr

  async getStudent(instituteId: string, studentId: string): Promise<any | null> {
    const key = `institute:${instituteId}:student:${studentId}`;
    const data = await this.redisService.getClient().get(key);
    return data ? JSON.parse(data) : null;
  }

  async setStudent(instituteId: string, studentId: string, data: any): Promise<void> {
    const key = `institute:${instituteId}:student:${studentId}`;
    await this.redisService.getClient().set(key, JSON.stringify(data), 'EX', this.TTL_STUDENT);
  }

  async invalidateStudent(instituteId: string, studentId: string): Promise<void> {
    const key = `institute:${instituteId}:student:${studentId}`;
    await this.redisService.getClient().del(key);
  }

  async getBatch(instituteId: string, batchId: string): Promise<any | null> {
    const key = `institute:${instituteId}:batch:${batchId}`;
    const data = await this.redisService.getClient().get(key);
    return data ? JSON.parse(data) : null;
  }

  async setBatch(instituteId: string, batchId: string, data: any): Promise<void> {
    const key = `institute:${instituteId}:batch:${batchId}`;
    await this.redisService.getClient().set(key, JSON.stringify(data), 'EX', this.TTL_BATCH);
  }

  async getInstituteConfig(instituteId: string): Promise<any | null> {
    const key = `institute:${instituteId}:config`;
    const data = await this.redisService.getClient().get(key);
    return data ? JSON.parse(data) : null;
  }
}
