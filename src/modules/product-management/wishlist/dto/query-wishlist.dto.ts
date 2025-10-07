import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQuery } from 'src/shared/dto/pagination_query.dto';

export class WishlistQueryDto extends PaginationQuery {
  @IsOptional()
  
  customerId?: number;

  @IsOptional()
  
  productId?: number;
}
