// src/attribute/service/attribute.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attribute } from '../entity/attribute.entity';
import { CreateAttributeDto } from '../dto/create-attribute.dto';
import { UpdateAttributeDto } from '../dto/update-attribute.dto';
import { PaginatedServiceResponse } from 'src/shared/interface/api-response.interface';
import { PaginationQuery } from 'src/shared/dto/pagination_query.dto';

@Injectable()
export class AttributeService {
  constructor(
    @InjectRepository(Attribute)
    private readonly attributeRepository: Repository<Attribute>,
  ) {}

  async create(createAttributeDto: CreateAttributeDto): Promise<Attribute> {
    // Check if attribute with same name already exists
    const existingAttribute = await this.attributeRepository.findOne({
      where: { name: createAttributeDto.name.toLowerCase() },
      withDeleted: true,
    });

    if (existingAttribute) {
      throw new ConflictException('Attribute with this name already exists');
    }

    // Create attribute
    const attribute = this.attributeRepository.create({
      ...createAttributeDto,
      name: createAttributeDto.name.toLowerCase(), // Store as lowercase for consistency
    });

    const savedAttribute = await this.attributeRepository.save(attribute);
    return this.findOne(savedAttribute.id);
  }

  async findAll(
    query: PaginationQuery,
  ): Promise<PaginatedServiceResponse<Attribute>> {
    const { page = 1, limit = 10, search } = query;

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      throw new BadRequestException('Invalid pagination parameters');
    }

    const queryBuilder = this.attributeRepository
      .createQueryBuilder('attribute')
      .leftJoinAndSelect('attribute.values', 'values')
      .orderBy('values.value', 'ASC');

    // Apply search filter
    if (search?.trim()) {
      queryBuilder.where('attribute.name ILIKE :search', {
        search: `%${search.trim().toLowerCase()}%`,
      });
    }

    // Apply pagination and ordering
    const [items, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('attribute.createdAt', 'DESC')
      .addOrderBy('values.value', 'ASC')
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

  async findOne(id: string): Promise<Attribute> {
    const attribute = await this.attributeRepository.findOne({
      where: { id },
      relations: ['values'],
      order: {
        values: { value: 'ASC' },
      },
    });

    if (!attribute) {
      throw new NotFoundException(`Attribute with ID ${id} not found`);
    }

    return attribute;
  }

  async findByName(name: string): Promise<Attribute | null> {
    return this.attributeRepository.findOne({
      where: { name: name.toLowerCase() },
      relations: ['values'],
    });
  }

  async update(
    id: string,
    updateAttributeDto: UpdateAttributeDto,
  ): Promise<Attribute> {
    const existingAttribute = await this.attributeRepository.findOne({
      where: { id },
    });

    if (!existingAttribute) {
      throw new NotFoundException(`Attribute with ID ${id} not found`);
    }

    // Check name uniqueness if name is being updated
    if (
      updateAttributeDto.name &&
      updateAttributeDto.name.toLowerCase() !== existingAttribute.name
    ) {
      const attributeWithName = await this.attributeRepository.findOne({
        where: { name: updateAttributeDto.name.toLowerCase() },
        withDeleted: true,
      });

      if (attributeWithName && attributeWithName.id !== id) {
        throw new ConflictException(
          `Attribute with name ${updateAttributeDto.name} already exists`,
        );
      }
    }

    // Prepare update data
    const updateData: Partial<Attribute> = {
      ...updateAttributeDto,
      ...(updateAttributeDto.name && {
        name: updateAttributeDto.name.toLowerCase(),
      }),
    };

    // Update attribute
    await this.attributeRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const attribute = await this.attributeRepository.findOne({
      where: { id },
      relations: ['values', 'values.productAttributeValues'],
      withDeleted: true,
    });

    if (!attribute) {
      throw new NotFoundException(`Attribute with ID ${id} not found`);
    }

    // Check if attribute has associated product attribute values
    const hasProductAssociations = attribute.values.some(
      (value) =>
        value.productAttributeValues && value.productAttributeValues.length > 0,
    );

    if (hasProductAssociations) {
      throw new BadRequestException(
        'Cannot delete attribute that is associated with products. Remove product associations first.',
      );
    }

    await this.attributeRepository.softDelete(id);
  }

  async restore(id: string): Promise<Attribute> {
    const attribute = await this.attributeRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!attribute) {
      throw new NotFoundException(`Attribute with ID ${id} not found`);
    }

    if (!attribute.deletedAt) {
      throw new BadRequestException('Attribute is not deleted');
    }

    await this.attributeRepository.restore(id);
    return this.findOne(id);
  }

  // Utility methods
  async getAttributesCount(): Promise<number> {
    return this.attributeRepository.count();
  }

  async findAllWithoutPagination(): Promise<Attribute[]> {
    return this.attributeRepository.find({
      relations: ['values'],
      order: {
        name: 'ASC',
        values: { value: 'ASC' },
      },
    });
  }

  async findByType(type: string): Promise<Attribute[]> {
    return this.attributeRepository.find({
      where: { type: type as any },
      relations: ['values'],
      order: {
        name: 'ASC',
        values: { value: 'ASC' },
      },
    });
  }
}
