import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCourierDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  vehicleType?: string;

  // JWT token được cấp sau khi verify OTP
  @IsNotEmpty()
  @IsString()
  verificationToken: string;
}

