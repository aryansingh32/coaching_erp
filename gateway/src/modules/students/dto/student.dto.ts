import { IsString, IsNotEmpty, IsOptional, IsEmail, IsPhoneNumber } from 'class-validator';

export class CreateStudentDto {
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @IsString()
  @IsOptional()
  last_name?: string;

  @IsEmail()
  @IsOptional()
  student_email_id?: string;

  @IsPhoneNumber('IN')
  @IsOptional()
  student_mobile_number?: string;

  @IsOptional()
  guardian?: any;
}

export class UpdateStudentDto {
  @IsString()
  @IsOptional()
  first_name?: string;

  @IsString()
  @IsOptional()
  last_name?: string;
}

export class AssignRfidDto {
  @IsString()
  @IsNotEmpty()
  rfidCard: string;
}
