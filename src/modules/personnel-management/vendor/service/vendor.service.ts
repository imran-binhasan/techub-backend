import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vendor } from '../entity/vendor.entity';
import { User } from '../../user/entity/user.entity';
import { UpdateVendorDto } from '../dto/update-vendor.dto';

@Injectable()
export class VendorService {
  constructor(
    @InjectRepository(Vendor)
    private vendorRepository: Repository<Vendor>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getProfile(userId: number) {
    const vendor = await this.vendorRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user', 'kyc', 'bankInfo', 'addresses'],
    });

    if (!vendor) {
      throw new NotFoundException('Vendor profile not found');
    }

    return vendor;
  }

  async updateProfile(userId: number, dto: UpdateVendorDto) {
    const vendor = await this.vendorRepository.findOne({
      where: { user: { id: userId } },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    Object.assign(vendor, dto);
    return this.vendorRepository.save(vendor);
  }

  async getShop(userId: number) {
    const vendor = await this.vendorRepository.findOne({
      where: { user: { id: userId } },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    return {
      shopName: vendor.shopName,
      shopSlug: vendor.shopSlug,
      shopDescription: vendor.shopDescription,
      shopLogo: vendor.shopLogo,
      shopBanner: vendor.shopBanner,
      status: vendor.status,
    };
  }

  async getAnalytics(userId: number) {
    const vendor = await this.vendorRepository.findOne({
      where: { user: { id: userId } },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    return {
      totalSales: vendor.totalSales,
      totalOrders: vendor.totalOrders,
      averageRating: vendor.averageRating,
      totalReviews: vendor.totalReviews,
    };
  }

  async getSalesReport(userId: number) {
    // TODO: Implement sales report generation
    return {};
  }
}