// src/attribute/dto/update-attribute.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateAttributeDto } from './create-attribute.dto';

export class UpdateAttributeDto extends PartialType(CreateAttributeDto) {}
