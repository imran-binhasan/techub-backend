
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../entity/customer.entity';

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
  ) {}

  async getProfile(customerId: number) {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
      relations: ['user'],
    });

    if (!customer) {
      throw new NotFoundException('Customer profile not found');
    }

    return customer;
  }


  async updateProfile(customerId: number, dto: UpdateCustomerDto) {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
      relations: ['user'],
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    await this.customerRepository.update(customer.id, dto);

    return this.customerRepository.findOne({
      where: { id: customer.id },
      relations: ['user'],
    });
  }

  async getOrders(customerId: number) {
    // TODO: Implement order fetching
    return [];
  }

  async getWishlists(customerId: number) {
    // TODO: Implement wishlist fetching
    return [];
  }
}