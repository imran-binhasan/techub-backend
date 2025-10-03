// src/cart/dto/cart-query.dto.ts
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQuery } from 'src/common/dto/pagination_query.dto';

export class CartQueryDto extends PaginationQuery {
  @IsOptional()
  customerId?: string;

  @IsOptional()

  productId?: string;
}
