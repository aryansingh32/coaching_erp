import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class GenerateFeeScheduleDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsNotEmpty()
  feeStructure: string;
}

export class RecordPaymentDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  referenceNumber: string;
}

export class RazorpayWebhookDto {
  @IsString()
  event: string;

  payload: any;
}
