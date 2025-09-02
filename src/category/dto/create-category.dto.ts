// src/category/dto/create-category.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Length,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCategoryDto {
  @IsString({ message: 'Category name must be a string' })
  @IsNotEmpty({ message: 'Category name is required' })
  @Length(2, 255, {
    message: 'Category name must be between 2 and 255 characters',
  })
  @Transform(({ value }) => value?.trim())
  name: string;

  @IsOptional()
  @IsUUID(4, { message: 'Parent category ID must be a valid UUID' })
  parentId?: string;
}
