import { 
  IsString, 
  IsNumber, 
  IsOptional, 
  IsUUID, 
  Min,
  IsNotEmpty 
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInventoryDto {
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  initialStock: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  reorderLevel?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
