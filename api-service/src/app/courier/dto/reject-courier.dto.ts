import { IsNotEmpty, IsString } from 'class-validator';

export class RejectCourierDto {
  @IsNotEmpty()
  @IsString()
  rejectionReason: string;
}

