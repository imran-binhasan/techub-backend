import {
  IsNotEmpty,
  IsNumber,
  Min,
  Max,
  IsOptional,
  IsEnum,
  IsString,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CartSource } from '../enum/cart.enum';
import { CART_VALIDATION } from '../constants/cart.constants';

export class CreateCartDto {
  @ApiProperty({
    description: 'Product ID to add to cart',
    example: 1,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty({ message: 'Product ID is required' })
  productId: number;

  @ApiPropertyOptional({
    description: 'Quantity of the product',
    example: 2,
    minimum: CART_VALIDATION.QUANTITY.MIN,
    maximum: CART_VALIDATION.QUANTITY.MAX,
    default: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Quantity must be a number' })
  @Min(CART_VALIDATION.QUANTITY.MIN, { message: 'Quantity must be at least 1' })
  @Max(CART_VALIDATION.QUANTITY.MAX, { message: 'Quantity cannot exceed 99' })
  @Type(() => Number)
  quantity?: number = 1;

  @ApiPropertyOptional({
    description: 'Source where the item was added from',
    enum: CartSource,
    example: CartSource.WEB,
    default: CartSource.WEB,
  })
  @IsOptional()
  @IsEnum(CartSource)
  source?: CartSource = CartSource.WEB;

  @ApiPropertyOptional({
    description: 'Selected product attributes/variants (e.g., size, color)',
    example: { size: 'L', color: 'red' },
  })
  @IsOptional()
  @IsObject()
  selectedAttributes?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Additional notes from customer',
    example: 'Gift wrap please',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
