// src/cart/dto/cart-query.dto.ts
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQuery } from 'src/common/dto/pagination_query.dto';

export class CartQueryDto extends PaginationQuery {
  @IsOptional()
  @IsUUID(4, { message: 'Customer ID must be a valid UUID' })
  customerId?: string;

  @IsOptional()
  @IsUUID(4, { message: 'Product ID must be a valid UUID' })
  productId?: string;
}