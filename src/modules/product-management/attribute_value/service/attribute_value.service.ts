import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttributeValue } from '../entity/attribute_value.entity';

import { PaginatedServiceResponse } from 'src/shared/interface/api-response.interface';
import { CreateAttributeValueDto } from '../dto/create-attribute_value.dto';
import { AttributeValueQueryDto } from '../dto/query-attribute_value.dto';
import { UpdateAttributeValueDto } from '../dto/update-attribute_value.dto';
import { Attribute } from '../../attribute/entity/attribute.entity';

@Injectable()
export class AttributeValueService {
  constructor(
    @InjectRepository(AttributeValue)
    private readonly attributeValueRepository: Repository<AttributeValue>,
    @InjectRepository(Attribute)
    private readonly attributeRepository: Repository<Attribute>,
  ) {}

  async create(
    createAttributeValueDto: CreateAttributeValueDto,
  ): Promise<AttributeValue> {
    // Verify attribute exists
    const attribute = await this.attributeRepository.findOne({
      where: { id: createAttributeValueDto.attributeId },
    });

    if (!attribute) {
      throw new NotFoundException(
        `Attribute with ID ${createAttributeValueDto.attributeId} not found`,
      );
    }

    // Check if attribute value already exists for this attribute
    const existingAttributeValue = await this.attributeValueRepository.findOne({
      where: {
        value: createAttributeValueDto.value.toLowerCase(),
        attribute: { id: createAttributeValueDto.attributeId },
      },
      withDeleted: true,
    });

    if (existingAttributeValue) {
      throw new ConflictException(
        `Attribute value "${createAttributeValueDto.value}" already exists for this attribute`,
      );
    }

    // Create attribute value
    const attributeValue = this.attributeValueRepository.create({
      value: createAttributeValueDto.value.toLowerCase(), // Store as lowercase for consistency
      attribute,
    });

    const savedAttributeValue =
      await this.attributeValueRepository.save(attributeValue);
    return this.findOne(savedAttributeValue.id);
  }

  async findAll(
    query: AttributeValueQueryDto,
  ): Promise<PaginatedServiceResponse<AttributeValue>> {
    const { page = 1, limit = 10, search, attributeId } = query;

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      throw new BadRequestException('Invalid pagination parameters');
    }

    const queryBuilder = this.attributeValueRepository
      .createQueryBuilder('attributeValue')
      .leftJoinAndSelect('attributeValue.attribute', 'attribute');

    // Apply attribute filter
    if (attributeId) {
      queryBuilder.where('attributeValue.attribute.id = :attributeId', {
        attributeId,
      });
    }

    // Apply search filter
    if (search?.trim()) {
      queryBuilder.andWhere('attributeValue.value ILIKE :search', {
        search: `%${search.trim().toLowerCase()}%`,
      });
    }

    // Apply pagination and ordering
    const [items, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('attribute.name', 'ASC')
      .addOrderBy('attributeValue.value', 'ASC')
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

  async findOne(id: string): Promise<AttributeValue> {
    const attributeValue = await this.attributeValueRepository.findOne({
      where: { id },
      relations: ['attribute'],
    });

    if (!attributeValue) {
      throw new NotFoundException(`Attribute value with ID ${id} not found`);
    }

    return attributeValue;
  }

  async findByAttribute(attributeId: string): Promise<AttributeValue[]> {
    const attribute = await this.attributeRepository.findOne({
      where: { id: attributeId },
    });

    if (!attribute) {
      throw new NotFoundException(`Attribute with ID ${attributeId} not found`);
    }

    return this.attributeValueRepository.find({
      where: { attribute: { id: attributeId } },
      relations: ['attribute'],
      order: { value: 'ASC' },
    });
  }

  async update(
    id: string,
    updateAttributeValueDto: UpdateAttributeValueDto,
  ): Promise<AttributeValue> {
    const existingAttributeValue = await this.attributeValueRepository.findOne({
      where: { id },
      relations: ['attribute'],
    });

    if (!existingAttributeValue) {
      throw new NotFoundException(`Attribute value with ID ${id} not found`);
    }

    // Verify new attribute exists if attributeId is being updated
    let attribute = existingAttributeValue.attribute;
    if (
      updateAttributeValueDto.attributeId &&
      updateAttributeValueDto.attributeId !== attribute.id
    ) {
      const foundAttribute = await this.attributeRepository.findOne({
        where: { id: updateAttributeValueDto.attributeId },
      });

      if (!foundAttribute) {
        throw new NotFoundException(
          `Attribute with ID ${updateAttributeValueDto.attributeId} not found`,
        );
      }
      attribute = foundAttribute;
    }

    // Check value uniqueness within the attribute if value is being updated
    const targetAttributeId =
      updateAttributeValueDto.attributeId || attribute.id;
    const targetValue =
      updateAttributeValueDto.value || existingAttributeValue.value;

    if (
      updateAttributeValueDto.value &&
      (updateAttributeValueDto.value.toLowerCase() !==
        existingAttributeValue.value ||
        updateAttributeValueDto.attributeId !== attribute.id)
    ) {
      const attributeValueWithValue =
        await this.attributeValueRepository.findOne({
          where: {
            value: targetValue.toLowerCase(),
            attribute: { id: targetAttributeId },
          },
          withDeleted: true,
        });

      if (attributeValueWithValue && attributeValueWithValue.id !== id) {
        throw new ConflictException(
          `Attribute value "${targetValue}" already exists for this attribute`,
        );
      }
    }

    // Prepare update data
    const updateData: Partial<AttributeValue> = {
      ...(updateAttributeValueDto.value && {
        value: updateAttributeValueDto.value.toLowerCase(),
      }),
      ...(updateAttributeValueDto.attributeId && { attribute }),
    };

    // Update attribute value
    await this.attributeValueRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const attributeValue = await this.attributeValueRepository.findOne({
      where: { id },
      relations: ['productAttributeValues'],
      withDeleted: true,
    });

    if (!attributeValue) {
      throw new NotFoundException(`Attribute value with ID ${id} not found`);
    }

    // Check if attribute value has associated products
    if (
      attributeValue.productAttributeValues &&
      attributeValue.productAttributeValues.length > 0
    ) {
      throw new BadRequestException(
        'Cannot delete attribute value that is associated with products. Remove product associations first.',
      );
    }

    await this.attributeValueRepository.softDelete(id);
  }

  async restore(id: string): Promise<AttributeValue> {
    const attributeValue = await this.attributeValueRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!attributeValue) {
      throw new NotFoundException(`Attribute value with ID ${id} not found`);
    }

    if (!attributeValue.deletedAt) {
      throw new BadRequestException('Attribute value is not deleted');
    }

    await this.attributeValueRepository.restore(id);
    return this.findOne(id);
  }

  // Utility methods
  async getAttributeValuesCount(): Promise<number> {
    return this.attributeValueRepository.count();
  }

  async findAllWithoutPagination(): Promise<AttributeValue[]> {
    return this.attributeValueRepository.find({
      relations: ['attribute'],
      order: {
        attribute: { name: 'ASC' },
        value: 'ASC',
      },
    });
  }

  async bulkCreateForAttribute(
    attributeId: string,
    values: string[],
  ): Promise<AttributeValue[]> {
    // Verify attribute exists
    const attribute = await this.attributeRepository.findOne({
      where: { id: attributeId },
    });

    if (!attribute) {
      throw new NotFoundException(`Attribute with ID ${attributeId} not found`);
    }

    // Get existing values for this attribute
    const existingValues = await this.attributeValueRepository.find({
      where: { attribute: { id: attributeId } },
      withDeleted: true,
    });

    const existingValueSet = new Set(
      existingValues.map((v) => v.value.toLowerCase()),
    );

    // Filter out values that already exist
    const newValues = values
      .map((v) => v.trim().toLowerCase())
      .filter((v) => v && !existingValueSet.has(v));

    if (newValues.length === 0) {
      throw new BadRequestException(
        'All provided values already exist for this attribute',
      );
    }

    // Create new attribute values
    const attributeValues = newValues.map((value) =>
      this.attributeValueRepository.create({
        value,
        attribute,
      }),
    );

    const savedAttributeValues =
      await this.attributeValueRepository.save(attributeValues);

    // Return with relations
    return Promise.all(savedAttributeValues.map((av) => this.findOne(av.id)));
  }
}
