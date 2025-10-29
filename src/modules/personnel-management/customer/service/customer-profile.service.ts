import { NotFoundException } from "@nestjs/common";
import { Injectable, ConflictException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Customer } from '../entity/customer.entity';
import { CustomerRegisterDto } from '../dto/customer-register.dto';
import { CustomerLoginDto } from '../dto/customer-login.dto';
import { CustomerAuthResponseDto } from '../dto/customer-auth-response.dto';
import { AuthBaseService } from 'src/core/auth/service/auth-base.service';
import { User, UserType } from '../../user/entity/user.entity';
import { TokenService } from 'src/core/auth/service/token-service';
import { RedisService } from 'src/core/redis/service/redis.service';
import { PasswordUtil } from 'src/shared/utils/password.util';


@Injectable()
export class CustomerProfileService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private cloudinaryService: CloudinaryService,
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
      email: customer.user.email,
      firstName: customer.user.firstName,
      lastName: customer.user.lastName,
      phone: customer.user.phone,
      image: customer.user.image,
      dateOfBirth: customer.dateOfBirth,
      gender: customer.gender,
      preferredLanguage: customer.preferredLanguage,
      tier: customer.tier,
      loyaltyPoints: customer.loyaltyPoints,
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

  async uploadProfileImage(
    customerId: number,
    file: Express.Multer.File,
  ): Promise<string> {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
      relations: ['user'],
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const imageUrl = await this.cloudinaryService.uploadCustomerImage(
      file,
      customerId,
    );

    await this.userRepository.update(customer.user.id, { image: imageUrl });
    await this.cacheService.del('customers', customerId.toString());

    return imageUrl;
  }
}
