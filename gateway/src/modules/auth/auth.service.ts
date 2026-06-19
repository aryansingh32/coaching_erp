import { Injectable, UnauthorizedException, Logger, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { EducationAdapter } from '../../adapters/erpnext/education.adapter';
import { FeaturesService } from '../../shared/feature-flags/features.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Institute } from '../../shared/entities/institute.entity';
import { DEFAULT_TENANT_ID } from '../../shared/constants/tenant.constants';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly erpAdapter: EducationAdapter,
    private readonly featuresService: FeaturesService,
    @InjectRepository(Institute) private readonly instituteRepo: Repository<Institute>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private isSuperAdminPhone(phone: string): boolean {
    const allowed = this.configService.get<string>('SUPER_ADMIN_PHONES') || '';
    return allowed.split(',').map((p) => p.trim()).filter(Boolean).includes(phone);
  }

  async sendOtp(phone: string, role: string): Promise<any> {
    if (role === 'super_admin') {
      if (!this.isSuperAdminPhone(phone)) {
        throw new UnauthorizedException('Not authorized as platform admin');
      }
    } else if (role === 'student') {
      await this.erpAdapter.getStudentByPhone(phone);
    } else if (role === 'instructor') {
      await this.erpAdapter.getInstructorByPhone(phone);
    } else if (role === 'parent') {
      await this.erpAdapter.getGuardianByPhone(phone);
    } else if (role === 'admin') {
      try {
        await this.erpAdapter.getInstructorByPhone(phone);
      } catch {
        const users = await this.erpAdapter.listDocs('User', [['mobile_no', '=', phone]]);
        if (!users?.length) {
          throw new UnauthorizedException('Admin user not found');
        }
      }
    }

    const otp = this.configService.get<string>('OTP_DEV_CODE') || '123456';
    const cacheKey = `otp:${phone}:${role}`;
    await this.cacheManager.set(cacheKey, otp, 300);
    this.logger.log(`OTP sent to ${phone} for role ${role}`);
    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(phone: string, otp: string, role: string): Promise<any> {
    const cacheKey = `otp:${phone}:${role}`;
    const storedOtp = await this.cacheManager.get<string>(cacheKey);

    if (!storedOtp || storedOtp !== otp) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    let erpUser: any;
    let linkedStudents: string[] = [];
    let tenantId =
      this.configService.get<string>('DEFAULT_TENANT_ID') || DEFAULT_TENANT_ID;

    if (role === 'super_admin') {
      if (!this.isSuperAdminPhone(phone)) {
        throw new UnauthorizedException('Not authorized as platform admin');
      }
      erpUser = { name: `superadmin-${phone}`, first_name: 'Platform', last_name: 'Admin' };
    } else if (role === 'student') {
      erpUser = await this.erpAdapter.getStudentByPhone(phone);
    } else if (role === 'instructor') {
      erpUser = await this.erpAdapter.getInstructorByPhone(phone);
    } else if (role === 'parent') {
      const guardian = await this.erpAdapter.getGuardianByPhone(phone);
      const students = await this.erpAdapter.getStudentsByGuardian(guardian.name);
      linkedStudents = students.map((s: any) => s.name);
      erpUser = { ...guardian, linkedStudents };
    } else if (role === 'admin') {
      try {
        erpUser = await this.erpAdapter.getInstructorByPhone(phone);
      } catch {
        const users = await this.erpAdapter.listDocs('User', [['mobile_no', '=', phone]]);
        erpUser = users[0];
      }
    } else {
      throw new UnauthorizedException('Invalid role');
    }

    await this.cacheManager.del(cacheKey);

    const tenant = await this.instituteRepo.findOne({ where: { id: tenantId } });
    const features = await this.featuresService.getTenantFeatures(tenantId);
    const branding = {
      primaryColor: tenant?.branding?.primaryColor || '#1e40af',
      instituteName: tenant?.name || 'Coaching Institute',
      logoUrl: tenant?.branding?.logoUrl,
    };

    const payload = {
      sub: erpUser.name,
      role,
      tenantId,
      linkedStudents: linkedStudents.length ? linkedStudents : undefined,
    };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return {
      accessToken,
      refreshToken,
      user: erpUser,
      role,
      tenantId,
      linkedStudents,
      branding,
      features,
    };
  }

  async getFeatures(tenantId: string) {
    return this.featuresService.getTenantFeatures(tenantId);
  }

  async refreshToken(token: string): Promise<any> {
    try {
      const decoded = this.jwtService.verify(token);
      const payload = {
        sub: decoded.sub,
        role: decoded.role,
        tenantId: decoded.tenantId,
        linkedStudents: decoded.linkedStudents,
      };
      const accessToken = this.jwtService.sign(payload);
      return { accessToken };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(token: string): Promise<any> {
    return { message: 'Logged out successfully' };
  }
}
