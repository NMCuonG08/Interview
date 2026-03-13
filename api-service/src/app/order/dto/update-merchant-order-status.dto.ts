import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateMerchantOrderStatusDto {
  @IsString()
  @IsIn(['accept', 'reject'])
  action!: 'accept' | 'reject';

  @IsOptional()
  @IsString()
  reason?: string;
}
