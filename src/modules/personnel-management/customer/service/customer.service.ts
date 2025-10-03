import * as argon2 from 'argon2';
import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Customer } from '../entity/customer.entity';
import { Repository } from 'typeorm';
import { CloudinaryService } from 'src/core/upload/service/cloudinary.service';
import { CreateCustomerDto } from '../dto/create-customer.dto';
import { UpdateCustomerDto } from '../dto/update-customer.dto';
import { PaginatedServiceResponse } from 'src/shared/interface/api-response.interface';
import { PaginationQuery } from 'src/shared/dto/pagination_query.dto';

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    private readonly uploadService: CloudinaryService,
  ) {}

  async create(
    createCustomerDto: CreateCustomerDto,
    image?: Express.Multer.File,
  ): Promise<Omit<Customer, 'password'>> {
    // Check if email already exists
    const existingCustomer = await this.customerRepository.findOne({
      where: { email: createCustomerDto.email },
      withDeleted: true,
    });

    if (existingCustomer) {
      throw new ConflictException('Customer with this email already exists');
    }

    // Hash password
    const hashedPassword = await argon2.hash(createCustomerDto.password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1,
    });

    // Create customer
    const customer = this.customerRepository.create({
      ...createCustomerDto,
      password: hashedPassword,
    });

    const savedCustomer = await this.customerRepository.save(customer);

    // Handle image upload
    if (image) {
      try {
        const uploadedImage = await this.uploadService.uploadCustomerImage(
          image,
          savedCustomer.id,
        );
        savedCustomer.image = uploadedImage;
        await this.customerRepository.save(savedCustomer);
      } catch (error) {
        // Rollback customer creation if image upload fails
        await this.customerRepository.delete(savedCustomer.id);
        throw error;
      }
    }

    // Return customer without password
    const { password, ...result } = savedCustomer;
    return result;
  }

  async findAll(
    query: PaginationQuery & { isActive?: boolean },
  ): Promise<PaginatedServiceResponse<Customer>> {
    const { page = 1, limit = 10, search, isActive } = query;

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      throw new BadRequestException('Invalid pagination parameters');
    }

    const queryBuilder = this.customerRepository
      .createQueryBuilder('customer')
      .select([
        'customer.id',
        'customer.firstName',
        'customer.lastName',
        'customer.email',
        'customer.phone',
        'customer.image',
        'customer.isActive',
        'customer.createdAt',
        'customer.updatedAt',
      ]);

    // Apply search filter
    if (search?.trim()) {
      queryBuilder.where(
        '(customer.firstName ILIKE :search OR customer.lastName ILIKE :search OR customer.email ILIKE :search OR customer.phone ILIKE :search)',
        { search: `%${search.trim()}%` },
      );
    }

    // Apply status filter
    if (isActive !== undefined) {
      queryBuilder.andWhere('customer.isActive = :isActive', { isActive });
    }

    // Apply pagination
    const [items, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('customer.createdAt', 'DESC')
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

  async findOne(id: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id },
      select: [
        'id',
        'firstName',
        'lastName',
        'email',
        'phone',
        'image',
        'isActive',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    return customer;
  }

  async findByEmail(email: string): Promise<Customer | null> {
    return this.customerRepository.findOne({
      where: { email },
      select: [
        'id',
        'firstName',
        'lastName',
        'email',
        'phone',
        'image',
        'isActive',
        'password', // Include password for authentication
      ],
    });
  }

  async update(
    id: string,
    updateCustomerDto: UpdateCustomerDto,
    image?: Express.Multer.File,
  ): Promise<Customer> {
    const existingCustomer = await this.customerRepository.findOne({
      where: { id },
    });

    if (!existingCustomer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    // Check email uniqueness if email is being updated
    if (
      updateCustomerDto.email &&
      updateCustomerDto.email !== existingCustomer.email
    ) {
      const customerWithEmail = await this.customerRepository.findOne({
        where: { email: updateCustomerDto.email },
        withDeleted: true,
      });

      if (customerWithEmail && customerWithEmail.id !== id) {
        throw new ConflictException(
          `Customer with email ${updateCustomerDto.email} already exists`,
        );
      }
    }

    // Hash password if provided
    // Prepare update data with proper typing using Partial<Customer>
    const updateData: Partial<Customer> = { ...updateCustomerDto };

    // Hash password if provided
    if (updateData.password) {
      updateData.password = await argon2.hash(updateData.password, {
        type: argon2.argon2id,
        memoryCost: 2 ** 16,
        timeCost: 3,
        parallelism: 1,
      });
    }

    // Handle image upload
    if (image) {
      const uploadedImage = await this.uploadService.uploadCustomerImage(
        image,
        id,
      );
      updateData.image = uploadedImage; // ✅ Now works perfectly
    }
    // Update customer
    await this.customerRepository.update(id, updateData);
    return this.findOne(id);
  }

  async toggleStatus(id: string): Promise<Customer> {
    const customer = await this.findOne(id);
    const newStatus = !customer.isActive;

    await this.customerRepository.update(id, { isActive: newStatus });
    return { ...customer, isActive: newStatus };
  }

  async softDelete(id: string): Promise<void> {
    const customer = await this.customerRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    await this.customerRepository.softDelete(id);
  }

  async restore(id: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    if (!customer.deletedAt) {
      throw new BadRequestException('Customer is not deleted');
    }

    await this.customerRepository.restore(id);
    return this.findOne(id);
  }

  // Utility methods
  async findWithRelations(
    id: string,
    relations: string[] = [],
  ): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id },
      relations,
      select: [
        'id',
        'firstName',
        'lastName',
        'email',
        'phone',
        'image',
        'isActive',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    return customer;
  }

  async countActiveCustomers(): Promise<number> {
    return this.customerRepository.count({
      where: { isActive: true },
    });
  }

  async findRecentCustomers(limit: number = 10): Promise<Customer[]> {
    return this.customerRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
      take: limit,
      select: [
        'id',
        'firstName',
        'lastName',
        'email',
        'phone',
        'image',
        'createdAt',
      ],
    });
  }
}
