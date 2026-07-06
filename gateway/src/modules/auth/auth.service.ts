import { Injectable, UnauthorizedException, Logger, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { EducationAdapter } from '../../adapters/erpnext/education.adapter';
import { FeaturesService } from '../../shared/feature-flags/features.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Institute } from '../../shared/entities/institute.entity';
import { DEFAULT_TENANT_ID } from '../../shared/constants/tenant.constants';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private googleClient: OAuth2Client;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly erpAdapter: EducationAdapter,
    private readonly featuresService: FeaturesService,
    private readonly httpService: HttpService,
    @InjectRepository(Institute) private readonly instituteRepo: Repository<Institute>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.googleClient = new OAuth2Client(this.configService.get<string>('GOOGLE_CLIENT_ID'));
  }

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

    const actualOtp = this.configService.get<string>('NODE_ENV') === 'production'
      ? Math.floor(100000 + Math.random() * 900000).toString()
      : (this.configService.get<string>('OTP_DEV_CODE') || '123456');

    const cacheKey = `otp:${phone}:${role}`;
    await this.cacheManager.set(cacheKey, actualOtp, 300);
    this.logger.log(`OTP generated for ${phone} role ${role}`);

    if (this.configService.get<string>('NODE_ENV') === 'production') {
      try {
        const msg91AuthKey = this.configService.get<string>('MSG91_AUTH_KEY');
        const templateId = this.configService.get<string>('MSG91_OTP_TEMPLATE_ID');
        if (msg91AuthKey && templateId) {
          await firstValueFrom(this.httpService.post(
            'https://api.msg91.com/api/v5/otp',
            { template_id: templateId, mobile: phone, otp: actualOtp },
            { headers: { authkey: msg91AuthKey, 'Content-Type': 'application/json' } }
          ));
          this.logger.log(`OTP SMS sent to ${phone} via MSG91`);
        } else {
          this.logger.warn('MSG91 credentials missing. OTP SMS not sent.');
        }
      } catch (error) {
        this.logger.error('Failed to send OTP SMS', error);
      }
    }

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

  async verifyGoogleLogin(token: string): Promise<any> {
    const ticket = await this.googleClient.verifyIdToken({
      idToken: token,
      audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new UnauthorizedException('Invalid Google Token');
    }
    
    let erpUser: any;
    let role = '';
    
    try {
      erpUser = await this.erpAdapter.getUserByEmail(payload.email);
    } catch {
      return { action: 'REGISTER_REQUIRED', email: payload.email, googleToken: token, name: payload.name };
    }

    if (erpUser.enabled === 0 || erpUser.custom_approval_status === 'Pending') {
      throw new UnauthorizedException('Your account is under approval from admin');
    }

    let specificUser: any;
    let linkedStudents: string[] = [];
    
    if (await this.erpAdapter.getStudentByEmail(payload.email)) {
       role = 'student';
       specificUser = await this.erpAdapter.getStudentByEmail(payload.email);
    } else if (await this.erpAdapter.getInstructorByEmail(payload.email)) {
       role = 'instructor';
       specificUser = await this.erpAdapter.getInstructorByEmail(payload.email);
    } else if (await this.erpAdapter.getGuardianByEmail(payload.email)) {
       role = 'parent';
       specificUser = await this.erpAdapter.getGuardianByEmail(payload.email);
       const students = await this.erpAdapter.getStudentsByGuardian(specificUser.name);
       linkedStudents = students.map((s: any) => s.name);
    } else {
       role = 'admin';
       specificUser = erpUser;
    }

    const tenantId = this.configService.get<string>('DEFAULT_TENANT_ID') || DEFAULT_TENANT_ID;
    const tenant = await this.instituteRepo.findOne({ where: { id: tenantId } });
    const features = await this.featuresService.getTenantFeatures(tenantId);
    const branding = {
      primaryColor: tenant?.branding?.primaryColor || '#1e40af',
      instituteName: tenant?.name || 'Coaching Institute',
      logoUrl: tenant?.branding?.logoUrl,
    };

    const jwtPayload = {
      sub: specificUser.name,
      role,
      tenantId,
      linkedStudents: linkedStudents.length ? linkedStudents : undefined,
    };
    const accessToken = this.jwtService.sign(jwtPayload);
    const refreshToken = this.jwtService.sign(jwtPayload, { expiresIn: '7d' });

    return {
      accessToken,
      refreshToken,
      user: role === 'parent' ? { ...specificUser, linkedStudents } : specificUser,
      role,
      tenantId,
      linkedStudents,
      branding,
      features,
    };
  }

  async registerGoogleUser(token: string, role: string, phone: string): Promise<any> {
    const ticket = await this.googleClient.verifyIdToken({
      idToken: token,
      audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) throw new UnauthorizedException('Invalid Google Token');
    
    const tenantId = this.configService.get<string>('DEFAULT_TENANT_ID') || DEFAULT_TENANT_ID;
    const companyName = await this.erpAdapter.getInstituteCompany(tenantId);
    
    const parts = (payload.name || '').split(' ');
    const firstName = parts[0] || 'User';
    const lastName = parts.slice(1).join(' ') || '';

    try {
      await this.erpAdapter.createUser({
         email: payload.email,
         first_name: firstName,
         last_name: lastName,
         send_welcome_email: 0,
         custom_approval_status: 'Pending'
      });
    } catch (e) {
      this.logger.error('Failed to create Frappe User', e);
      // Might already exist
    }

    try {
      if (role === 'student') {
         await this.erpAdapter.createStudent({
           first_name: firstName,
           last_name: lastName,
           student_email_id: payload.email,
           student_mobile_number: phone,
           company: companyName
         });
      } else if (role === 'instructor' || role === 'admin') {
         await this.erpAdapter.createInstructor({
           instructor_name: payload.name || 'User',
           email_address: payload.email,
           cell_number: phone,
           company: companyName
         });
      } else if (role === 'parent') {
         await this.erpAdapter.createDoc('Guardian', {
           guardian_name: payload.name || 'User',
           email_address: payload.email,
           mobile_number: phone
         });
      }
    } catch (e) {
      this.logger.error('Failed to create specific role document', e);
    }

    return { message: 'Account created. Under approval from admin.' };
  }
}
