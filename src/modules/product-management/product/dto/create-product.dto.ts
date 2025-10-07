import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  Min,
  IsNotEmpty,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  stock: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;

  @IsOptional()
  @IsNumber()
  categoryId?: number;

  @IsOptional()
  @IsNumber()
  brandId?: number;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  attributeValueIds?: number[];
}
