import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Coupon } from '../entity/coupon.entity';
import { CouponService } from '../service/coupon.service';
import { CouponController } from '../controller/coupon.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([Coupon]),
    ],
    controllers: [CouponController],
    providers: [CouponService],
    exports: [CouponService],
})
export class CouponModule {}