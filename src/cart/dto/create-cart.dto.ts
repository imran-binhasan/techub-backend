// src/cart/dto/create-cart.dto.ts
import { IsUUID, IsNotEmpty, IsNumber, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCartDto {
  @IsUUID(4, { message: 'Product ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Product ID is required' })
  productId: string;

  @IsOptional()
  @IsNumber({}, { message: 'Quantity must be a number' })
  @Min(1, { message: 'Quantity must be at least 1' })
  @Type(() => Number)
  quantity?: number = 1;
}
