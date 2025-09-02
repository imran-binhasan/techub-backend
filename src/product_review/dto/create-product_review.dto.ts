import {
  IsString,
  IsNumber,
  IsUUID,
  Min,
  Max,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductReviewDto {
  @IsNumber()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  rating: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  comment: string;

  @IsUUID()
  productId: string;
}
