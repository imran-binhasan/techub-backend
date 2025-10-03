import { IsOptional, IsUUID, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationQuery } from 'src/shared/dto/pagination_query.dto';

export class ProductImageQueryDto extends PaginationQuery {
  @IsOptional()
  
  productId?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  })
  @IsBoolean()
  isPrimary?: boolean;
}
