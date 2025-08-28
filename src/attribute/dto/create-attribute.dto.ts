// src/attribute/dto/create-attribute.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  Length,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { AttributeType } from '../entity/attribute.entity';

export class CreateAttributeDto {
  @IsString({ message: 'Attribute name must be a string' })
  @IsNotEmpty({ message: 'Attribute name is required' })
  @Length(2, 255, { message: 'Attribute name must be between 2 and 255 characters' })
  @Transform(({ value }) => value?.trim())
  name: string;

  @IsEnum(AttributeType, { 
    message: `Type must be one of: ${Object.values(AttributeType).join(', ')}` 
  })
  @IsNotEmpty({ message: 'Attribute type is required' })
  type: AttributeType;
}

