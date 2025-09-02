import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TransactionType } from '../entity/inventory-transactuin.entity';

export class StockAdjustmentDto {
  @IsEnum(TransactionType)
  type: TransactionType;

  @IsNumber()
  @Type(() => Number)
  quantity: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  reason?: string;

  @IsOptional()
  @IsString()
  referenceId?: string;
}

// src/inventory/dto/inventory-query.dto.ts
