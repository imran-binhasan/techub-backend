// src/category/dto/category-query.dto.ts
import { IsOptional, IsUUID, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationQuery } from 'src/shared/dto/pagination_query.dto';

export class CategoryQueryDto extends PaginationQuery {
  @IsOptional()
  parentId?: string;

  @IsOptional()
  @IsBoolean({ message: 'Root only must be a boolean' })
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  rootOnly?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'Include children must be a boolean' })
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  includeChildren?: boolean;
}
