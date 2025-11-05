import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsEnum,
  IsBoolean,
  Min,
  Max,
  IsNotEmpty,
  Length,
  Matches,
  ValidateIf,
  ArrayMaxSize,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ProductStatus,
  ProductCondition,
  ProductVisibility,
  DiscountType,
} from '../enum/product.enum';
import {
  PRODUCT_VALIDATION,
  STOCK_THRESHOLDS,
} from '../constants/product.constants';

export class CreateProductDto {
  @ApiProperty({
    description: 'Product name',
    example: 'Premium Wireless Headphones',
    minLength: PRODUCT_VALIDATION.NAME.MIN_LENGTH,
    maxLength: PRODUCT_VALIDATION.NAME.MAX_LENGTH,
  })
  @IsString()
  @IsNotEmpty()
  @Length(
    PRODUCT_VALIDATION.NAME.MIN_LENGTH,
    PRODUCT_VALIDATION.NAME.MAX_LENGTH,
  )
  name: string;

  @ApiPropertyOptional({
    description: 'Product SKU (auto-generated if not provided)',
    example: 'ELEC-SONY-PWH-12345',
    pattern: PRODUCT_VALIDATION.SKU.PATTERN.source,
  })
  @IsOptional()
  @IsString()
  @Length(PRODUCT_VALIDATION.SKU.MIN_LENGTH, PRODUCT_VALIDATION.SKU.MAX_LENGTH)
  @Matches(PRODUCT_VALIDATION.SKU.PATTERN, {
    message:
      'SKU must contain only alphanumeric characters, dashes, and underscores',
  })
  sku?: string;

  @ApiPropertyOptional({
    description: 'Product URL slug (auto-generated from name if not provided)',
    example: 'premium-wireless-headphones',
    pattern: PRODUCT_VALIDATION.SLUG.PATTERN.source,
  })
  @IsOptional()
  @IsString()
  @Length(
    PRODUCT_VALIDATION.SLUG.MIN_LENGTH,
    PRODUCT_VALIDATION.SLUG.MAX_LENGTH,
  )
  @Matches(PRODUCT_VALIDATION.SLUG.PATTERN, {
    message: 'Slug must contain only lowercase letters, numbers, and dashes',
  })
  slug?: string;

  @ApiProperty({
    description: 'Product description',
    example: 'High-quality wireless headphones with noise cancellation...',
    minLength: PRODUCT_VALIDATION.DESCRIPTION.MIN_LENGTH,
    maxLength: PRODUCT_VALIDATION.DESCRIPTION.MAX_LENGTH,
  })
  @IsString()
  @IsNotEmpty()
  @Length(
    PRODUCT_VALIDATION.DESCRIPTION.MIN_LENGTH,
    PRODUCT_VALIDATION.DESCRIPTION.MAX_LENGTH,
  )
  description: string;

  @ApiPropertyOptional({
    description: 'Product status',
    enum: ProductStatus,
    default: ProductStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({
    description: 'Product condition',
    enum: ProductCondition,
    default: ProductCondition.NEW,
  })
  @IsOptional()
  @IsEnum(ProductCondition)
  condition?: ProductCondition;

  @ApiPropertyOptional({
    description: 'Product visibility',
    enum: ProductVisibility,
    default: ProductVisibility.PUBLIC,
  })
  @IsOptional()
  @IsEnum(ProductVisibility)
  visibility?: ProductVisibility;

  @ApiProperty({
    description: 'Available stock quantity',
    example: 100,
    minimum: STOCK_THRESHOLDS.OUT_OF_STOCK,
    maximum: PRODUCT_VALIDATION.STOCK.MAX,
  })
  @IsNumber()
  @Min(STOCK_THRESHOLDS.OUT_OF_STOCK)
  @Max(PRODUCT_VALIDATION.STOCK.MAX)
  @Type(() => Number)
  stock: number;

  @ApiProperty({
    description: 'Product price',
    example: 299.99,
    minimum: PRODUCT_VALIDATION.PRICE.MIN,
    maximum: PRODUCT_VALIDATION.PRICE.MAX,
  })
  @IsNumber({ maxDecimalPlaces: PRODUCT_VALIDATION.PRICE.DECIMAL_PLACES })
  @Min(PRODUCT_VALIDATION.PRICE.MIN)
  @Max(PRODUCT_VALIDATION.PRICE.MAX)
  @Type(() => Number)
  price: number;

  @ApiPropertyOptional({
    description: 'Compare at price (original/MSRP price)',
    example: 399.99,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: PRODUCT_VALIDATION.PRICE.DECIMAL_PLACES })
  @Min(0)
  @Type(() => Number)
  compareAtPrice?: number;

  @ApiPropertyOptional({
    description: 'Cost per item (for profit calculation)',
    example: 150.0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: PRODUCT_VALIDATION.PRICE.DECIMAL_PLACES })
  @Min(0)
  @Type(() => Number)
  costPerItem?: number;

  @ApiPropertyOptional({
    description: 'Discount type',
    enum: DiscountType,
    default: DiscountType.NONE,
  })
  @IsOptional()
  @IsEnum(DiscountType)
  discountType?: DiscountType;

  @ApiPropertyOptional({
    description:
      'Discount value (percentage or fixed amount based on discountType)',
    example: 15,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @ValidateIf((o) => o.discountType === DiscountType.PERCENTAGE)
  @Max(100)
  @Type(() => Number)
  discountValue?: number;

  @ApiPropertyOptional({
    description: 'Category ID',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  categoryId?: number;

  @ApiPropertyOptional({
    description: 'Brand ID',
    example: 5,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  brandId?: number;

  @ApiPropertyOptional({
    description: 'Vendor ID',
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  vendorId?: number;

  @ApiPropertyOptional({
    description: 'Product attribute value IDs',
    example: [1, 5, 8],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  attributeValueIds?: number[];

  // SEO Fields
  @ApiPropertyOptional({
    description: 'SEO meta title',
    example: 'Premium Wireless Headphones - Buy Online',
    maxLength: PRODUCT_VALIDATION.SEO.META_TITLE_MAX,
  })
  @IsOptional()
  @IsString()
  @Length(1, PRODUCT_VALIDATION.SEO.META_TITLE_MAX)
  metaTitle?: string;

  @ApiPropertyOptional({
    description: 'SEO meta description',
    example: 'Shop premium wireless headphones with noise cancellation...',
    maxLength: PRODUCT_VALIDATION.SEO.META_DESCRIPTION_MAX,
  })
  @IsOptional()
  @IsString()
  @Length(1, PRODUCT_VALIDATION.SEO.META_DESCRIPTION_MAX)
  metaDescription?: string;

  @ApiPropertyOptional({
    description: 'SEO keywords',
    example: ['wireless headphones', 'noise cancellation', 'premium audio'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(PRODUCT_VALIDATION.SEO.KEYWORDS_MAX)
  keywords?: string[];

  // Feature Flags
  @ApiPropertyOptional({
    description: 'Mark product as featured',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isFeatured?: boolean;

  @ApiPropertyOptional({
    description: 'Publish product immediately',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isPublished?: boolean;
}
