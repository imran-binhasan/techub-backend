import { 
    IsOptional, 
    IsString, 
    IsEnum,
    IsBoolean,
    IsDate
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PaginationQuery } from 'src/common/dto/pagination_query.dto';
import { CouponType } from '../entity/coupon.entity';

export class CouponQueryDto extends PaginationQuery {
    @IsOptional()
    @IsEnum(CouponType)
    couponType?: CouponType;

    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return undefined;
    })
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return undefined;
    })
    @IsBoolean()
    isExpired?: boolean;

    @IsOptional()
    @IsString()
    code?: string;
}