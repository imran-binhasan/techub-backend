// src/attribute_value/dto/attribute-value-query.dto.ts
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQuery } from 'src/common/dto/pagination_query.dto';

export class AttributeValueQueryDto extends PaginationQuery {
  @IsOptional()
  @IsUUID(4, { message: 'Attribute ID must be a valid UUID' })
  attributeId?: string;
}