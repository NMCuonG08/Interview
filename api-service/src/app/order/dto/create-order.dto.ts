import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderItemDto {
  @IsString()
  @IsNotEmpty()
  productExternalId: string;

  @IsNumber()
  @Min(1)
  @Max(9999)
  @Type(() => Number)
  quantity: number;
}

export class DeliveryLocationDto {
  @IsNumber()
  @Type(() => Number)
  latitude: number;

  @IsNumber()
  @Type(() => Number)
  longitude: number;
}

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  merchantExternalId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => DeliveryLocationDto)
  deliveryLocation?: DeliveryLocationDto;

  @IsOptional()
  @IsString()
  deliveryAddressNote?: string;
}

