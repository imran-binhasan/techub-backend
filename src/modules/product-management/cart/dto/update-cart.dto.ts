// src/cart/dto/update-cart.dto.ts
import { IsNumber, IsNotEmpty, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateCartDto {
  @IsNumber({}, { message: 'Quantity must be a number' })
  @IsNotEmpty({ message: 'Quantity is required' })
  @Min(1, { message: 'Quantity must be at least 1' })
  @Type(() => Number)
  quantity: number;
}
