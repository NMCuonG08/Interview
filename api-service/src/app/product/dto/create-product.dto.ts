import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type, Transform, plainToInstance } from 'class-transformer';

export class LocalizedStringDto {
  @IsString()
  @IsNotEmpty()
  vi: string;

  @IsString()
  @IsOptional()
  en?: string;

  @IsString()
  @IsOptional()
  ko?: string;
}

export class ProductMetadataDto {
  @IsOptional()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsString()
  thumbnail?: string;
}

export class CreateProductDto {
  @IsNotEmpty()
  @ValidateNested()
  @Transform(({ value }) => {
    let parsed;
    if (typeof value === 'string') {
      try {
        parsed = JSON.parse(value);
        if (typeof parsed === 'string') {
          parsed = { vi: parsed };
        }
      } catch {
        parsed = { vi: value };
      }
    } else {
      parsed = value;
    }
    return plainToInstance(LocalizedStringDto, parsed);
  })
  @Type(() => LocalizedStringDto)
  name: LocalizedStringDto;

  @IsOptional()
  @ValidateNested()
  @Transform(({ value }) => {
    if (!value) return undefined;
    let parsed;
    if (typeof value === 'string') {
      try {
        parsed = JSON.parse(value);
        if (typeof parsed === 'string') {
          parsed = { vi: parsed };
        }
      } catch {
        parsed = { vi: value };
      }
    } else {
      parsed = value;
    }
    return plainToInstance(LocalizedStringDto, parsed);
  })
  @Type(() => LocalizedStringDto)
  description?: LocalizedStringDto;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  price: number;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (value === '' ? undefined : value))
  categoryId: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value === '' ? undefined : value))
  sku?: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) =>
    value === '' || value === null ? undefined : value
  )
  @Type(() => Number)
  stock?: number;

  @IsString()
  @IsOptional()
  merchantId?: string;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => ProductMetadataDto)
  metadata?: ProductMetadataDto;
}
