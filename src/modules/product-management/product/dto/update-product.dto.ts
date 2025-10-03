import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  stock?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price?: number;

  @IsOptional()
  
  categoryId?: string | null;

  @IsOptional()
  
  brandId?: string | null;

  @IsOptional()
  @IsArray()
  attributeValueIds?: string[];
}
