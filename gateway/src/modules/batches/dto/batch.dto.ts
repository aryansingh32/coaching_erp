import { IsString, IsNotEmpty, IsOptional, IsArray, IsDateString } from 'class-validator';

export class CreateBatchDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  program: string;

  @IsString()
  @IsOptional()
  academic_term?: string;
  
  @IsString()
  @IsOptional()
  academic_year?: string;
}

export class EnrollStudentDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;
}

export class ScheduleBatchDto {
  @IsArray()
  days: string[];
  
  @IsString()
  startTime: string;

  @IsString()
  endTime: string;
}
