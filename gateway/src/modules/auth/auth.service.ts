import { Injectable, UnauthorizedException, Logger, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { EducationAdapter } from '../../adapters/erpnext/education.adapter';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly erpAdapter: EducationAdapter,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async sendOtp(phone: string, role: string): Promise<any> {
    // 1. Verify existence in ERPNext based on role
    // Assuming we mostly test student for now, or adapt based on role
    if (role === 'student') {
      await this.erpAdapter.getStudentByPhone(phone); // Throws 404 if not found
    } else {
      // Stub for instructor / parent logic
    }
    
    // 2. Generate OTP
    const otp = '123456'; // hardcoded for testing/dev per standard simplified flows, in prod use crypto/random
    const cacheKey = `otp:${phone}`;
    await this.cacheManager.set(cacheKey, otp, 300); // 5 minutes TTL
    
    // 3. Send SMS (mocked)
    this.logger.log(`Sending OTP ${otp} to ${phone}`);
    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(phone: string, otp: string, role: string): Promise<any> {
    const cacheKey = `otp:${phone}`;
    const storedOtp = await this.cacheManager.get<string>(cacheKey);

    if (!storedOtp || storedOtp !== otp) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Determine ERP user details
    let erpUser;
    if (role === 'student') {
      erpUser = await this.erpAdapter.getStudentByPhone(phone);
    } else {
      erpUser = { name: `mock-${role}-${phone}` };
    }

    await this.cacheManager.del(cacheKey);

    const payload = { sub: erpUser.name, role: role, tenantId: 'default' };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    // Normally store refreshToken hash in Postgres here for rotation
    return {
      accessToken,
      refreshToken,
      user: erpUser
    };
  }

  async refreshToken(token: string): Promise<any> {
    try {
      const decoded = this.jwtService.verify(token);
      const payload = { sub: decoded.sub, role: decoded.role, tenantId: decoded.tenantId };
      const accessToken = this.jwtService.sign(payload);
      return { accessToken };
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(token: string): Promise<any> {
    // Blacklist token logic could go here
    return { message: 'Logged out successfully' };
  }
}
