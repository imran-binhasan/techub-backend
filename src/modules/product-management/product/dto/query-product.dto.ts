import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsBoolean,
  IsArray,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQuery } from 'src/shared/dto/pagination_query.dto';
import {
  ProductStatus,
  ProductCondition,
  ProductVisibility,
  ProductSortField,
  ProductSortOrder,
} from '../enum/product.enum';

export class ProductQueryDto extends PaginationQuery {
  @ApiPropertyOptional({
    description: 'Filter by category ID',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  categoryId?: number;

  @ApiPropertyOptional({
    description: 'Filter by multiple category IDs',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((id) => parseInt(id.trim(), 10));
    }
    return value;
  })
  categoryIds?: number[];

  @ApiPropertyOptional({
    description: 'Filter by brand ID',
    example: 5,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  brandId?: number;

  @ApiPropertyOptional({
    description: 'Filter by multiple brand IDs',
    example: [5, 7, 9],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((id) => parseInt(id.trim(), 10));
    }
    return value;
  })
  brandIds?: number[];

  @ApiPropertyOptional({
    description: 'Filter by vendor ID',
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  vendorId?: number;

  @ApiPropertyOptional({
    description: 'Filter by product status',
    enum: ProductStatus,
    example: ProductStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({
    description: 'Filter by product condition',
    enum: ProductCondition,
    example: ProductCondition.NEW,
  })
  @IsOptional()
  @IsEnum(ProductCondition)
  condition?: ProductCondition;

  @ApiPropertyOptional({
    description: 'Filter by product visibility',
    enum: ProductVisibility,
    example: ProductVisibility.PUBLIC,
  })
  @IsOptional()
  @IsEnum(ProductVisibility)
  visibility?: ProductVisibility;

  @ApiPropertyOptional({
    description: 'Minimum price',
    example: 0,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  minPrice?: number;

  @ApiPropertyOptional({
    description: 'Maximum price',
    example: 1000,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxPrice?: number;

  @ApiPropertyOptional({
    description: 'Minimum rating',
    example: 4,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  minRating?: number;

  @ApiPropertyOptional({
    description: 'Filter by stock availability',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  })
  @IsBoolean()
  inStock?: boolean;

  @ApiPropertyOptional({
    description: 'Filter featured products only',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  })
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({
    description: 'Filter published products only',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  })
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by attribute value IDs',
    example: [1, 5, 8],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((id) => parseInt(id.trim(), 10));
    }
    return value;
  })
  attributeValueIds?: number[];

  @ApiPropertyOptional({
    description: 'Field to sort by',
    enum: ProductSortField,
    default: ProductSortField.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(ProductSortField)
  sortBy?: ProductSortField;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ProductSortOrder,
    default: ProductSortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(ProductSortOrder)
  sortOrder?: ProductSortOrder;

  @ApiPropertyOptional({
    description: 'Filter by SKU (partial match)',
    example: 'ELEC-SONY',
  })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({
    description: 'Filter by slug',
    example: 'premium-wireless-headphones',
  })
  @IsOptional()
  @IsString()
  slug?: string;
}
