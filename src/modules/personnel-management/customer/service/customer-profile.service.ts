import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../entity/customer.entity';
import { CustomerProfileDto } from '../dto/customer-profile.dto';
import { UpdateCustomerProfileDto } from '../dto/update-customer.dto';
import { User } from '../../user/entity/user.entity';
import { CacheService } from 'src/core/cache/service/cache.service';

@Injectable()
export class CustomerProfileService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private cacheService: CacheService,
  ) {}

  async getProfile(customerId: number): Promise<CustomerProfileDto> {
    // Try cache
    const cached = await this.cacheService.get<CustomerProfileDto>(
      'customers',
      customerId.toString(),
    );
    if (cached) return cached;

    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
      relations: ['user'],
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const dto: CustomerProfileDto = {
      id: customer.id,
      email: customer.user.email!,
      firstName: customer.user.firstName,
      lastName: customer.user.lastName,
      phone: customer.user.phone,
      image: customer.user.image,
      dateOfBirth: customer.dateOfBirth,
      gender: customer.gender,
      preferredLanguage: customer.preferredLanguage,
      tier: customer.tier,
      rewardPoints: customer.rewardPoints,
      totalOrders: customer.totalOrders,
      totalSpent: parseFloat(customer.totalSpent.toString()),
      createdAt: customer.createdAt,
    };

    // Cache for 30 minutes
    await this.cacheService.set('customers', customerId.toString(), dto, {
      ttl: 1800,
    });

    return dto;
  }

  async updateProfile(
    customerId: number,
    dto: UpdateCustomerProfileDto,
  ): Promise<CustomerProfileDto> {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
      relations: ['user'],
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Update user fields
    if (dto.firstName || dto.lastName) {
      await this.userRepository.update(customer.user.id, {
        firstName: dto.firstName,
        lastName: dto.lastName,
      });
    }

    // Update customer fields
    await this.customerRepository.update(customerId, {
      dateOfBirth: dto.dateOfBirth,
      gender: dto.gender,
      preferredLanguage: dto.preferredLanguage,
    });

    // Invalidate cache
    await this.cacheService.del('customers', customerId.toString());

    return this.getProfile(customerId);
  }
}
