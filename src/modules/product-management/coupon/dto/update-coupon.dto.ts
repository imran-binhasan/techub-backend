import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsDate,
  Min,
  Max,
  ValidateIf,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CouponType } from '../entity/coupon.entity';

export class UpdateCouponDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsEnum(CouponType)
  couponType?: CouponType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minPurchase?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxDiscountAmount?: number;

  @IsOptional()
  @ValidateIf((o) => o.couponType === CouponType.PERCENTAGE)
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  discountPercentage?: number;

  @IsOptional()
  @ValidateIf((o) => o.couponType === CouponType.FIXED)
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  discountAmount?: number;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  maxUsageLimit?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
