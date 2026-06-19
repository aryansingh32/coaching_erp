import { IsString, IsNotEmpty, IsPhoneNumber, IsEnum } from 'class-validator';

export class SendOtpDto {
  @IsPhoneNumber('IN')
  @IsNotEmpty()
  phone: string;

  @IsEnum(['student', 'instructor', 'parent'])
  role: string;
}

export class VerifyOtpDto {
  @IsPhoneNumber('IN')
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  otp: string;
  
  @IsEnum(['student', 'instructor', 'parent'])
  role: string;
}

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
