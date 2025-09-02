// src/coupon/controller/coupon.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CouponService } from '../service/coupon.service';
import { CreateCouponDto } from '../dto/create-coupon.dto';
import { UpdateCouponDto } from '../dto/update-coupon.dto';

import {
  RequirePermissions,
  RequireResource,
  Public,
} from 'src/auth/decorator/auth.decorator';
import { CouponQueryDto } from '../dto/queryl-coupon.dto';
import { ValidateCouponDto } from '../dto/validate-coupon.dto';

@Controller('coupon')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @RequireResource('coupon', 'create')
  @Post()
  async create(@Body() createCouponDto: CreateCouponDto) {
    const result = await this.couponService.create(createCouponDto);
    return {
      success: true,
      message: 'Coupon created successfully',
      data: result,
    };
  }

  @RequirePermissions('read:coupon')
  @Get()
  async findAll(@Query() query: CouponQueryDto) {
    const result = await this.couponService.findAll(query);
    return {
      success: true,
      message: 'Coupons retrieved successfully',
      data: result,
    };
  }

  @RequirePermissions('read:coupon')
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.couponService.findOne(id);
    return {
      success: true,
      message: 'Coupon retrieved successfully',
      data: result,
    };
  }

  @RequireResource('coupon', 'update')
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCouponDto: UpdateCouponDto,
  ) {
    const result = await this.couponService.update(id, updateCouponDto);
    return {
      success: true,
      message: 'Coupon updated successfully',
      data: result,
    };
  }

  @RequireResource('coupon', 'delete')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.couponService.remove(id);
    return {
      success: true,
      message: 'Coupon deleted successfully',
    };
  }

  // Public endpoints
  @Public()
  @Post('validate')
  async validateCoupon(@Body() validateDto: ValidateCouponDto) {
    const result = await this.couponService.validateCoupon(validateDto);
    return {
      success: result.isValid,
      message:
        result.message ||
        (result.isValid ? 'Coupon is valid' : 'Coupon is invalid'),
      data: result.isValid
        ? {
            coupon: result.coupon,
            discountAmount: result.discountAmount,
          }
        : null,
    };
  }

  @Public()
  @Get('public/active')
  async getActiveCoupons() {
    const result = await this.couponService.getActiveCoupons();
    return {
      success: true,
      message: 'Active coupons retrieved successfully',
      data: result,
    };
  }

  // Admin utility endpoints
  @RequirePermissions('read:coupon')
  @Get('reports/stats')
  async getStats() {
    const result = await this.couponService.getCouponStats();
    return {
      success: true,
      message: 'Coupon statistics retrieved successfully',
      data: result,
    };
  }

  @RequirePermissions('read:coupon')
  @Get('reports/expired')
  async getExpiredCoupons() {
    const result = await this.couponService.getExpiredCoupons();
    return {
      success: true,
      message: 'Expired coupons retrieved successfully',
      data: result,
    };
  }
}
