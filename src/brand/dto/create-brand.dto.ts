// src/brand/dto/create-brand.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  Length,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateBrandDto {
  @IsString({ message: 'Brand name must be a string' })
  @IsNotEmpty({ message: 'Brand name is required' })
  @Length(2, 255, { message: 'Brand name must be between 2 and 255 characters' })
  @Transform(({ value }) => value?.trim())
  name: string;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @Length(0, 1000, { message: 'Description must not exceed 1000 characters' })
  @Transform(({ value }) => value?.trim())
  description?: string;
}

