import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { COURIER_APPROVAL_STATUS } from '../../common/constants/courier.constant';

export class CourierQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  include?: string;

  @IsOptional()
  @IsEnum(COURIER_APPROVAL_STATUS)
  approvalStatus?: string;

  @IsOptional()
  @IsString()
  search?: string;
}

export interface CourierListResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

