import { IsOptional, IsUUID } from 'class-validator';

export class UpdateWishlistDto {
  @IsOptional()
  customerId?: number;

  @IsOptional()
  productId?: number;
}
