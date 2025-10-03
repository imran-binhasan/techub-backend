// src/attribute_value/dto/attribute-value-query.dto.ts
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQuery } from 'src/shared/dto/pagination_query.dto';

export class AttributeValueQueryDto extends PaginationQuery {
  @IsOptional()
  attributeId?: string;
}
