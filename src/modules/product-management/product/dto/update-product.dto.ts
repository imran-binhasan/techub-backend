import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
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
  @IsNumber()
  categoryId?: number | null;

  @IsOptional()
  @IsNumber()
  brandId?: number | null;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  attributeValueIds?: number[];
}
