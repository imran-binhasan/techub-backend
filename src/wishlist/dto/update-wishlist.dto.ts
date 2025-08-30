import { IsOptional, IsUUID } from 'class-validator';

export class UpdateWishlistDto {
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsUUID()
  productId?: string;
}
