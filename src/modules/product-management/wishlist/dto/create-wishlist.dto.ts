import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateWishlistDto {
  @IsNumber()
  @IsNotEmpty()
  customerId: number;

  @IsNumber()
  @IsNotEmpty()
  productId: number;
}
