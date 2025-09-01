import { IsString, IsNumber, IsUUID, Min, Max, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateProductReviewDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  rating?: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsUUID()
  productId?: string;
}
