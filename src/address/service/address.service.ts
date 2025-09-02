// src/address/service/address.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from '../entity/address.entity';
import { Customer } from 'src/customer/entity/customer.entity';

import { UpdateAddressDto } from '../dto/update-address.dto';
import { AddressQueryDto } from '../dto/query-address.dto';
import { PaginatedServiceResponse } from 'src/common/interface/api-response.interface';
import { CreateAddressDto } from '../dto/create-addresss.dto';

@Injectable()
export class AddressService {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async create(createAddressDto: CreateAddressDto): Promise<Address> {
    const { customerId, isDefault, ...addressData } = createAddressDto;

    // Check if customer exists
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    // If this is going to be the default address, unset other defaults
    if (isDefault) {
      await this.unsetDefaultAddresses(customerId);
    }

    // Create address
    const address = this.addressRepository.create({
      ...addressData,
      isDefault: isDefault || false,
      customer,
    });

    const savedAddress = await this.addressRepository.save(address);
    return this.findOne(savedAddress.id);
  }

  async findAll(
    query: AddressQueryDto,
  ): Promise<PaginatedServiceResponse<Address>> {
    const {
      page = 1,
      limit = 10,
      search,
      customerId,
      type,
      country,
      isDefault,
    } = query;

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      throw new BadRequestException('Invalid pagination parameters');
    }

    const queryBuilder = this.addressRepository
      .createQueryBuilder('address')
      .leftJoinAndSelect('address.customer', 'customer')
      .select([
        'address.id',
        'address.street',
        'address.city',
        'address.state',
        'address.postalCode',
        'address.addressLine',
        'address.type',
        'address.country',
        'address.isDefault',
        'address.createdAt',
        'address.updatedAt',
        'customer.id',
        'customer.firstName',
        'customer.lastName',
        'customer.email',
      ]);

    // Apply filters
    if (search?.trim()) {
      queryBuilder.andWhere(
        '(address.street ILIKE :search OR address.city ILIKE :search OR address.state ILIKE :search OR address.addressLine ILIKE :search)',
        { search: `%${search.trim()}%` },
      );
    }

    if (customerId) {
      queryBuilder.andWhere('customer.id = :customerId', { customerId });
    }

    if (type) {
      queryBuilder.andWhere('address.type = :type', { type });
    }

    if (country) {
      queryBuilder.andWhere('address.country = :country', { country });
    }

    if (isDefault !== undefined) {
      queryBuilder.andWhere('address.isDefault = :isDefault', { isDefault });
    }

    // Apply pagination and ordering
    const [items, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('address.isDefault', 'DESC')
      .addOrderBy('address.createdAt', 'DESC')
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

  async findOne(id: string): Promise<Address> {
    const address = await this.addressRepository.findOne({
      where: { id },
      relations: ['customer'],
    });

    if (!address) {
      throw new NotFoundException(`Address with ID ${id} not found`);
    }

    return address;
  }

  async findByCustomer(customerId: string): Promise<Address[]> {
    return this.addressRepository.find({
      where: { customer: { id: customerId } },
      relations: ['customer'],
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  async findDefaultAddress(customerId: string): Promise<Address | null> {
    return this.addressRepository.findOne({
      where: { customer: { id: customerId }, isDefault: true },
      relations: ['customer'],
    });
  }

  async update(
    id: string,
    updateAddressDto: UpdateAddressDto,
  ): Promise<Address> {
    const existingAddress = await this.addressRepository.findOne({
      where: { id },
      relations: ['customer'],
    });

    if (!existingAddress) {
      throw new NotFoundException(`Address with ID ${id} not found`);
    }

    // If setting as default, unset other defaults for the same customer
    if (updateAddressDto.isDefault) {
      await this.unsetDefaultAddresses(existingAddress.customer.id);
    }

    // Update address
    await this.addressRepository.update(id, updateAddressDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const address = await this.addressRepository.findOne({
      where: { id },
    });

    if (!address) {
      throw new NotFoundException(`Address with ID ${id} not found`);
    }

    await this.addressRepository.remove(address);
  }

  async setAsDefault(id: string): Promise<Address> {
    const address = await this.addressRepository.findOne({
      where: { id },
      relations: ['customer'],
    });

    if (!address) {
      throw new NotFoundException(`Address with ID ${id} not found`);
    }

    // Unset other defaults for the same customer
    await this.unsetDefaultAddresses(address.customer.id);

    // Set this address as default
    await this.addressRepository.update(id, { isDefault: true });
    return this.findOne(id);
  }

  async restore(id: string): Promise<Address> {
    const address = await this.addressRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!address) {
      throw new NotFoundException(`Address with ID ${id} not found`);
    }

    if (!address.deletedAt) {
      throw new BadRequestException('Address is not deleted');
    }

    await this.addressRepository.restore(id);
    return this.findOne(id);
  }

  async getAddressesCount(customerId: string): Promise<number> {
    return this.addressRepository.count({
      where: { customer: { id: customerId } },
    });
  }

  // Private helper methods
  private async unsetDefaultAddresses(customerId: string): Promise<void> {
    await this.addressRepository.update(
      { customer: { id: customerId } },
      { isDefault: false },
    );
  }
}
