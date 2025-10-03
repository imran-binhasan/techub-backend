import { IsUUID, IsNotEmpty } from 'class-validator';

export class CreateWishlistDto {
  
  @IsNotEmpty()
  customerId: string;

  
  @IsNotEmpty()
  productId: string;
}
