import { IsString, IsNotEmpty, IsDateString } from 'class-validator';

export class RfidPunchDto {
  @IsString()
  @IsNotEmpty()
  rfidCard: string;

  @IsString()
  @IsNotEmpty()
  deviceId: string;
}

export class ManualAttendanceDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsNotEmpty()
  batchId: string;

  @IsDateString()
  date: string;

  @IsString()
  @IsNotEmpty()
  status: string; // Present, Absent
}
