// src/attribute_value/dto/update-attribute-value.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateAttributeValueDto } from './create-attribute_value.dto';

export class UpdateAttributeValueDto extends PartialType(
  CreateAttributeValueDto,
) {}
