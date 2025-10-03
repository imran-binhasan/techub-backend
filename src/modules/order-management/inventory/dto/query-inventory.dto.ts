import { IsOptional, IsString, IsUUID, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationQuery } from 'src/shared/dto/pagination_query.dto';

export class InventoryQueryDto extends PaginationQuery {
  @IsOptional()
  
  productId?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  })
  @IsBoolean()
  lowStock?: boolean;
}
