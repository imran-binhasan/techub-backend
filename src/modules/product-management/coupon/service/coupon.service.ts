import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan } from 'typeorm';
import { Coupon, CouponType } from '../entity/coupon.entity';
import { CreateCouponDto } from '../dto/create-coupon.dto';
import { UpdateCouponDto } from '../dto/update-coupon.dto';
import { PaginatedServiceResponse } from 'src/shared/interface/api-response.interface';
import { CouponQueryDto } from '../dto/queryl-coupon.dto';
import { ValidateCouponDto } from '../dto/validate-coupon.dto';

@Injectable()
export class CouponService {
  constructor(
    @InjectRepository(Coupon)
    private readonly couponRepository: Repository<Coupon>,
  ) {}

  async create(createCouponDto: CreateCouponDto): Promise<Coupon> {
    // Validate dates
    if (createCouponDto.startDate >= createCouponDto.endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    // Check if coupon code already exists
    const existingCoupon = await this.couponRepository.findOne({
      where: { code: createCouponDto.code.toUpperCase() },
      withDeleted: true,
    });

    if (existingCoupon) {
      throw new ConflictException('Coupon code already exists');
    }

    // Validate coupon type specific fields
    if (createCouponDto.couponType === CouponType.PERCENTAGE) {
      if (!createCouponDto.discountPercentage) {
        throw new BadRequestException(
          'Discount percentage is required for percentage coupons',
        );
      }
    } else if (createCouponDto.couponType === CouponType.FIXED) {
      if (!createCouponDto.discountAmount) {
        throw new BadRequestException(
          'Discount amount is required for fixed coupons',
        );
      }
    }

    const coupon = this.couponRepository.create({
      ...createCouponDto,
      code: createCouponDto.code.toUpperCase(),
    });

    return this.couponRepository.save(coupon);
  }

  async findAll(
    query: CouponQueryDto,
  ): Promise<PaginatedServiceResponse<Coupon>> {
    const {
      page = 1,
      limit = 10,
      search,
      couponType,
      isActive,
      isExpired,
      code,
    } = query;

    if (page < 1 || limit < 1 || limit > 100) {
      throw new BadRequestException('Invalid pagination parameters');
    }

    const queryBuilder = this.couponRepository.createQueryBuilder('coupon');

    if (search?.trim()) {
      queryBuilder.andWhere(
        '(coupon.name ILIKE :search OR coupon.code ILIKE :search)',
        { search: `%${search.trim()}%` },
      );
    }

    if (code?.trim()) {
      queryBuilder.andWhere('coupon.code ILIKE :code', {
        code: `%${code.trim().toUpperCase()}%`,
      });
    }

    if (couponType) {
      queryBuilder.andWhere('coupon.couponType = :couponType', { couponType });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('coupon.isActive = :isActive', { isActive });
    }

    if (isExpired !== undefined) {
      const now = new Date();
      if (isExpired) {
        queryBuilder.andWhere('coupon.endDate < :now', { now });
      } else {
        queryBuilder.andWhere('coupon.endDate >= :now', { now });
      }
    }

    const [items, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('coupon.createdAt', 'DESC')
      .getManyAndCount();

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number): Promise<Coupon> {
    const coupon = await this.couponRepository.findOne({
      where: { id },
    });

    if (!coupon) {
      throw new NotFoundException(`Coupon with ID ${id} not found`);
    }

    return coupon;
  }

  async findByCode(code: string): Promise<Coupon> {
    const coupon = await this.couponRepository.findOne({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      throw new NotFoundException(`Coupon with code ${code} not found`);
    }

    return coupon;
  }

  async update(id: number, updateCouponDto: UpdateCouponDto): Promise<Coupon> {
    const existingCoupon = await this.couponRepository.findOne({
      where: { id },
    });

    if (!existingCoupon) {
      throw new NotFoundException(`Coupon with ID ${id} not found`);
    }

    // Check code uniqueness if code is being updated
    if (
      updateCouponDto.code &&
      updateCouponDto.code.toUpperCase() !== existingCoupon.code
    ) {
      const couponWithCode = await this.couponRepository.findOne({
        where: { code: updateCouponDto.code.toUpperCase() },
        withDeleted: true,
      });

      if (couponWithCode && couponWithCode.id !== id) {
        throw new ConflictException('Coupon code already exists');
      }
    }

    // Validate dates if being updated
    const startDate = updateCouponDto.startDate || existingCoupon.startDate;
    const endDate = updateCouponDto.endDate || existingCoupon.endDate;

    if (startDate >= endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    // Convert code to uppercase if provided
    const updateData = {
      ...updateCouponDto,
      ...(updateCouponDto.code && { code: updateCouponDto.code.toUpperCase() }),
    };

    await this.couponRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const coupon = await this.couponRepository.findOne({
      where: { id },
    });

    if (!coupon) {
      throw new NotFoundException(`Coupon with ID ${id} not found`);
    }

    await this.couponRepository.softDelete(id);
  }

  async validateCoupon(validateDto: ValidateCouponDto): Promise<{
    isValid: boolean;
    coupon?: Coupon;
    discountAmount?: number;
    message?: string;
  }> {
    const { code, orderAmount } = validateDto;

    try {
      const coupon = await this.findByCode(code);
      const now = new Date();

      // Check if coupon is active
      if (!coupon.isActive) {
        return {
          isValid: false,
          message: 'Coupon is not active',
        };
      }

      // Check if coupon is within valid date range
      if (now < coupon.startDate) {
        return {
          isValid: false,
          message: 'Coupon is not yet valid',
        };
      }

      if (now > coupon.endDate) {
        return {
          isValid: false,
          message: 'Coupon has expired',
        };
      }

      // Check usage limit
      if (coupon.maxUsageLimit && coupon.usageCount >= coupon.maxUsageLimit) {
        return {
          isValid: false,
          message: 'Coupon usage limit exceeded',
        };
      }

      // Check minimum purchase requirement
      if (orderAmount < coupon.minPurchase) {
        return {
          isValid: false,
          message: `Minimum purchase amount of $${coupon.minPurchase} required`,
        };
      }

      // Calculate discount amount
      let discountAmount = 0;

      if (coupon.couponType === CouponType.PERCENTAGE) {
        discountAmount = (orderAmount * coupon.discountPercentage) / 100;
        if (
          coupon.maxDiscountAmount &&
          discountAmount > coupon.maxDiscountAmount
        ) {
          discountAmount = coupon.maxDiscountAmount;
        }
      } else if (coupon.couponType === CouponType.FIXED) {
        discountAmount = coupon.discountAmount;
        if (discountAmount > orderAmount) {
          discountAmount = orderAmount;
        }
      }

      return {
        isValid: true,
        coupon,
        discountAmount: Math.round(discountAmount * 100) / 100, // Round to 2 decimal places
      };
    } catch (error) {
      return {
        isValid: false,
        message: 'Invalid coupon code',
      };
    }
  }

  async incrementUsage(id: number): Promise<void> {
    await this.couponRepository.increment({ id }, 'usageCount', 1);
  }

  // Utility methods
  async getActiveCoupons(): Promise<Coupon[]> {
    const now = new Date();
    return this.couponRepository.find({
      where: {
        isActive: true,
        startDate: LessThan(now),
        endDate: MoreThan(now),
      },
      order: { createdAt: 'DESC' },
    });
  }

  async getExpiredCoupons(): Promise<Coupon[]> {
    const now = new Date();
    return this.couponRepository.find({
      where: {
        endDate: LessThan(now),
      },
      order: { endDate: 'DESC' },
    });
  }

  async getCouponStats(): Promise<{
    total: number;
    active: number;
    expired: number;
    mostUsed: Coupon | null;
  }> {
    const now = new Date();

    const [total, active, expired, mostUsed] = await Promise.all([
      this.couponRepository.count(),
      this.couponRepository.count({
        where: {
          isActive: true,
          startDate: LessThan(now),
          endDate: MoreThan(now),
        },
      }),
      this.couponRepository.count({
        where: {
          endDate: LessThan(now),
        },
      }),
      this.couponRepository.findOne({
        order: { usageCount: 'DESC' },
      }),
    ]);

    return {
      total,
      active,
      expired,
      mostUsed,
    };
  }
}
