import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsNotEmpty,
  IsDate,
  Min,
  Max,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CouponType } from '../entity/coupon.entity';

export class CreateCouponDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsEnum(CouponType)
  couponType: CouponType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minPurchase?: number = 0;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxDiscountAmount?: number;

  @ValidateIf((o) => o.couponType === CouponType.PERCENTAGE)
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  discountPercentage?: number;

  @ValidateIf((o) => o.couponType === CouponType.FIXED)
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  discountAmount?: number;

  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @IsDate()
  @Type(() => Date)
  endDate: Date;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  maxUsageLimit?: number;
}
