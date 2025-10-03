// src/product-review/dto/query-product-review.dto.ts
import {
  IsOptional,
  IsUUID,
  IsNumber,
  Min,
  Max,
  IsString,
  IsIn,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PaginationQuery } from 'src/common/dto/pagination_query.dto';

export class ProductReviewQueryDto extends PaginationQuery {
  @IsOptional()
  
  productId?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  rating?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  minRating?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  maxRating?: number;

  @IsOptional()
  @IsString()
  @IsIn(['createdAt', 'updatedAt', 'rating', 'name'])
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsString()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
