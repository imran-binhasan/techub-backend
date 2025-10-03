import { IsOptional, IsUUID } from 'class-validator';

export class UpdateWishlistDto {
  @IsOptional()
  
  customerId?: string;

  @IsOptional()
  
  productId?: string;
}
