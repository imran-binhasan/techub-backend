import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Coupon } from '../entity/coupon.entity';
import { CouponService } from '../service/coupon.service';
import { CouponController } from '../controller/coupon.controller';
import { AuthModule } from 'src/auth/module/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Coupon]), AuthModule],
  controllers: [CouponController],
  providers: [CouponService],
  exports: [CouponService],
})
export class CouponModule {}
