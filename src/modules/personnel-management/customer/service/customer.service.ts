
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../entity/customer.entity';
import { User } from '../../user/entity/user.entity';
import { UpdateCustomerDto } from '../dto/update-customer.dto';

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getProfile(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['customer'],
    });

    if (!user?.customer) {
      throw new NotFoundException('Customer profile not found');
    }

    return user.customer;
  }

  async updateProfile(userId: number, dto: UpdateCustomerDto) {
    const customer = await this.customerRepository.findOne({
      where: { user: { id: userId } },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    Object.assign(customer, dto);
    return this.customerRepository.save(customer);
  }

  async getOrders(userId: number) {
    // TODO: Implement order fetching
    return [];
  }

  async getWishlists(userId: number) {
    // TODO: Implement wishlist fetching
    return [];
  }
}