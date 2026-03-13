import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { MERCHANT_STATUS } from '../../common/constants/merchant.constant';

export class UpdateMerchantStatusDto {
  @IsNotEmpty()
  @IsEnum(MERCHANT_STATUS)
  status: MERCHANT_STATUS;

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
