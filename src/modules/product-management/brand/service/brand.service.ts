// src/brand/service/brand.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from '../entity/brand.entity';
import { CloudinaryService } from 'src/core/upload/service/cloudinary.service';
import { PaginatedServiceResponse } from 'src/shared/interface/api-response.interface';
import { CreateBrandDto } from '../dto/create-brand.dto';
import { UpdateBrandDto } from '../dto/update-brand.dto';
import { PaginationQuery } from 'src/shared/dto/pagination_query.dto';

@Injectable()
export class BrandService {
  constructor(
    @InjectRepository(Brand)
    private readonly brandRepository: Repository<Brand>,
    private readonly uploadService: CloudinaryService,
  ) {}

  async create(
    createBrandDto: CreateBrandDto,
    logo?: Express.Multer.File,
  ): Promise<Brand> {
    // Check if brand with same name already exists
    const existingBrand = await this.brandRepository.findOne({
      where: { name: createBrandDto.name },
      withDeleted: true,
    });

    if (existingBrand) {
      throw new ConflictException('Brand with this name already exists');
    }

    // Create brand
    const brand = this.brandRepository.create(createBrandDto);
    const savedBrand = await this.brandRepository.save(brand);

    // Handle logo upload
    if (logo) {
      try {
        const uploadedLogo = await this.uploadService.uploadBrandLogo(
          logo,
          savedBrand.id,
        );
        savedBrand.logo = uploadedLogo;
        await this.brandRepository.save(savedBrand);
      } catch (error) {
        // Rollback brand creation if logo upload fails
        await this.brandRepository.delete(savedBrand.id);
        throw error;
      }
    }

    return this.findOne(savedBrand.id);
  }

  async findAll(
    query: PaginationQuery,
  ): Promise<PaginatedServiceResponse<Brand>> {
    const { page = 1, limit = 10, search } = query;

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      throw new BadRequestException('Invalid pagination parameters');
    }

    const queryBuilder = this.brandRepository
      .createQueryBuilder('brand')
      .select([
        'brand.id',
        'brand.name',
        'brand.description',
        'brand.logo',
        'brand.createdAt',
        'brand.updatedAt',
      ]);

    // Apply search filter
    if (search?.trim()) {
      queryBuilder.where(
        '(brand.name ILIKE :search OR brand.description ILIKE :search)',
        { search: `%${search.trim()}%` },
      );
    }

    // Apply pagination
    const [items, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('brand.createdAt', 'DESC')
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

  async findOne(id: string): Promise<Brand> {
    const brand = await this.brandRepository.findOne({
      where: { id },
      select: ['id', 'name', 'description', 'logo', 'createdAt', 'updatedAt'],
    });

    if (!brand) {
      throw new NotFoundException(`Brand with ID ${id} not found`);
    }

    return brand;
  }

  async findByName(name: string): Promise<Brand | null> {
    return this.brandRepository.findOne({
      where: { name },
    });
  }

  async update(
    id: string,
    updateBrandDto: UpdateBrandDto,
    logo?: Express.Multer.File,
  ): Promise<Brand> {
    const existingBrand = await this.brandRepository.findOne({
      where: { id },
    });

    if (!existingBrand) {
      throw new NotFoundException(`Brand with ID ${id} not found`);
    }

    // Check name uniqueness if name is being updated
    if (updateBrandDto.name && updateBrandDto.name !== existingBrand.name) {
      const brandWithName = await this.brandRepository.findOne({
        where: { name: updateBrandDto.name },
        withDeleted: true,
      });

      if (brandWithName && brandWithName.id !== id) {
        throw new ConflictException(
          `Brand with name ${updateBrandDto.name} already exists`,
        );
      }
    }

    // Prepare update data
    const updateData: Partial<Brand> = { ...updateBrandDto };

    // Handle logo upload
    if (logo) {
      const uploadedLogo = await this.uploadService.uploadBrandLogo(logo, id);
      updateData.logo = uploadedLogo;
    }

    // Update brand
    await this.brandRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const brand = await this.brandRepository.findOne({
      where: { id },
      relations: ['products'],
      withDeleted: true,
    });

    if (!brand) {
      throw new NotFoundException(`Brand with ID ${id} not found`);
    }

    // Check if brand has associated products
    if (brand.products && brand.products.length > 0) {
      throw new BadRequestException(
        'Cannot delete brand that has associated products. Remove product associations first.',
      );
    }

    await this.brandRepository.softDelete(id);
  }

  async restore(id: string): Promise<Brand> {
    const brand = await this.brandRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!brand) {
      throw new NotFoundException(`Brand with ID ${id} not found`);
    }

    if (!brand.deletedAt) {
      throw new BadRequestException('Brand is not deleted');
    }

    await this.brandRepository.restore(id);
    return this.findOne(id);
  }

  // Utility methods
  async getBrandsCount(): Promise<number> {
    return this.brandRepository.count();
  }

  async findAllWithoutPagination(): Promise<Brand[]> {
    return this.brandRepository.find({
      select: ['id', 'name', 'description', 'logo'],
      order: { name: 'ASC' },
    });
  }

  async findWithProducts(id: string): Promise<Brand> {
    const brand = await this.brandRepository.findOne({
      where: { id },
      relations: ['products'],
    });

    if (!brand) {
      throw new NotFoundException(`Brand with ID ${id} not found`);
    }

    return brand;
  }
}
