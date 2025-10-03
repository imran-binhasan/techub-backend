// src/product/dto/product-query.dto.ts
import {
  IsOptional,
  IsString,
  IsUUID,
  IsNumber,
  Min,
  Max,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PaginationQuery } from 'src/shared/dto/pagination_query.dto';

export class ProductQueryDto extends PaginationQuery {
  @IsOptional()
  
  categoryId?: string;

  @IsOptional()
  
  brandId?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxPrice?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  })
  @IsBoolean()
  inStock?: boolean;
}
