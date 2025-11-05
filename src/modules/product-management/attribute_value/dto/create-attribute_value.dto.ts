// src/attribute_value/dto/create-attribute-value.dto.ts
import { IsString, IsNotEmpty, IsUUID, Length } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateAttributeValueDto {
  @IsString({ message: 'Value must be a string' })
  @IsNotEmpty({ message: 'Value is required' })
  @Length(1, 255, { message: 'Value must be between 1 and 255 characters' })
  @Transform(({ value }) => value?.trim())
  value: string;

  @IsNotEmpty({ message: 'Attribute ID is required' })
  attributeId: number;
}
