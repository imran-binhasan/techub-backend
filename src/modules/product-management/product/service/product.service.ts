// src/product/service/product.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entity/product.entity';
import { ProductAttributeValue } from '../entity/product_attribute_value.entity';
import { Category } from 'src/modules/product-management/category/entity/category.entity';
import { Brand } from 'src/modules/product-management/brand/entity/brand.entity';
import { AttributeValue } from 'src/modules/product-management/attribute_value/entity/attribute_value.entity';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ProductQueryDto } from '../dto/query-product.dto';
import { PaginatedServiceResponse } from 'src/shared/interface/api-response.interface';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductAttributeValue)
    private readonly productAttributeValueRepository: Repository<ProductAttributeValue>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Brand)
    private readonly brandRepository: Repository<Brand>,
    @InjectRepository(AttributeValue)
    private readonly attributeValueRepository: Repository<AttributeValue>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    // Check if product with same name already exists
    const existingProduct = await this.productRepository.findOne({
      where: { name: createProductDto.name },
      withDeleted: true,
    });

    if (existingProduct) {
      throw new ConflictException('Product with this name already exists');
    }

    // Validate and fetch category
    let category: Category | null = null;
    if (createProductDto.categoryId) {
      category = await this.categoryRepository.findOne({
        where: { id: createProductDto.categoryId },
      });

      if (!category) {
        throw new NotFoundException(
          `Category with ID ${createProductDto.categoryId} not found`,
        );
      }
    }

    // Validate and fetch brand (optional)
    let brand: Brand | null = null;
    if (createProductDto.brandId) {
      brand = await this.brandRepository.findOne({
        where: { id: createProductDto.brandId },
      });

      if (!brand) {
        throw new NotFoundException(
          `Brand with ID ${createProductDto.brandId} not found`,
        );
      }
    }

    // Create product
    const product = this.productRepository.create({
      name: createProductDto.name,
      description: createProductDto.description,
      stock: createProductDto.stock,
      price: createProductDto.price,
      ...(category && { category }),
      ...(brand && { brand }),
    });

    const savedProduct = await this.productRepository.save(product) as Product;

    // Handle attribute values if provided
    if (
      createProductDto.attributeValueIds?.length &&
      createProductDto.attributeValueIds.length > 0
    ) {
      await this.handleAttributeValues(
        savedProduct.id,
        createProductDto.attributeValueIds,
      );
    }

    return this.findOne(savedProduct.id);
  }

  async findAll(
    query: ProductQueryDto,
  ): Promise<PaginatedServiceResponse<Product>> {
    const {
      page = 1,
      limit = 10,
      search,
      categoryId,
      brandId,
      minPrice,
      maxPrice,
      inStock,
    } = query;

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      throw new BadRequestException('Invalid pagination parameters');
    }

    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.images', 'images')
      .select([
        'product.id',
        'product.name',
        'product.description',
        'product.stock',
        'product.price',
        'product.createdAt',
        'product.updatedAt',
        'category.id',
        'category.name',
        'brand.id',
        'brand.name',
        'images.id',
        'images.url',
        'images.altText',
      ]);

    // Apply filters
    if (search?.trim()) {
      queryBuilder.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search)',
        { search: `%${search.trim()}%` },
      );
    }

    if (categoryId) {
      queryBuilder.andWhere('category.id = :categoryId', { categoryId });
    }

    if (brandId) {
      queryBuilder.andWhere('brand.id = :brandId', { brandId });
    }

    if (minPrice !== undefined) {
      queryBuilder.andWhere('product.price >= :minPrice', { minPrice });
    }

    if (maxPrice !== undefined) {
      queryBuilder.andWhere('product.price <= :maxPrice', { maxPrice });
    }

    if (inStock !== undefined) {
      if (inStock) {
        queryBuilder.andWhere('product.stock > 0');
      } else {
        queryBuilder.andWhere('product.stock = 0');
      }
    }

    // Apply pagination and ordering
    const [items, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('product.createdAt', 'DESC')
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

  async findOne(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: [
        'category',
        'brand',
        'images',
        'attributeValues',
        'attributeValues.attributeValue',
        'attributeValues.attributeValue.attribute',
      ],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async findByName(name: string): Promise<Product | null> {
    return this.productRepository.findOne({
      where: { name },
      relations: ['category', 'brand'],
    });
  }

  async update(
    id: number,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const existingProduct = await this.productRepository.findOne({
      where: { id },
      relations: ['category', 'brand', 'attributeValues'],
    });

    if (!existingProduct) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Check name uniqueness if name is being updated
    if (
      updateProductDto.name &&
      updateProductDto.name !== existingProduct.name
    ) {
      const productWithName = await this.productRepository.findOne({
        where: { name: updateProductDto.name },
        withDeleted: true,
      });

      if (productWithName && productWithName.id !== id) {
        throw new ConflictException(
          `Product with name ${updateProductDto.name} already exists`,
        );
      }
    }

    // Validate and fetch category if being updated
    let category: Category | null = existingProduct.category;
    if (updateProductDto.categoryId !== undefined) {
      if (updateProductDto.categoryId === null) {
        category = null;
      } else {
        category = await this.categoryRepository.findOne({
          where: { id: updateProductDto.categoryId },
        });

        if (!category) {
          throw new NotFoundException(
            `Category with ID ${updateProductDto.categoryId} not found`,
          );
        }
      }
    }

    // Validate and fetch brand if being updated
    let brand: Brand | null = existingProduct.brand;
    if (updateProductDto.brandId !== undefined) {
      if (updateProductDto.brandId === null) {
        brand = null;
      } else {
        brand = await this.brandRepository.findOne({
          where: { id: updateProductDto.brandId },
        });

        if (!brand) {
          throw new NotFoundException(
            `Brand with ID ${updateProductDto.brandId} not found`,
          );
        }
      }
    }

    // Prepare update data - handle null values properly
    const updateData: any = {};

    if (updateProductDto.name) {
      updateData.name = updateProductDto.name;
    }

    if (updateProductDto.description) {
      updateData.description = updateProductDto.description;
    }

    if (updateProductDto.stock !== undefined) {
      updateData.stock = updateProductDto.stock;
    }

    if (updateProductDto.price !== undefined) {
      updateData.price = updateProductDto.price;
    }

    if (updateProductDto.categoryId !== undefined) {
      updateData.category = category;
    }

    if (updateProductDto.brandId !== undefined) {
      updateData.brand = brand;
    }

    // Update product
    await this.productRepository.update(id, updateData);

    // Handle attribute values update if provided
    if (updateProductDto.attributeValueIds !== undefined) {
      await this.updateAttributeValues(id, updateProductDto.attributeValueIds);
    }

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['carts', 'reviews'],
      withDeleted: true,
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Check if product is in any carts
    if (product.carts && product.carts.length > 0) {
      throw new BadRequestException(
        'Cannot delete product that is in customer carts. Remove from carts first.',
      );
    }

    // Soft delete the product (this will cascade to attribute values due to onDelete: 'CASCADE')
    await this.productRepository.softDelete(id);
  }

  async restore(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    if (!product.deletedAt) {
      throw new BadRequestException('Product is not deleted');
    }

    await this.productRepository.restore(id);
    return this.findOne(id);
  }

  // Utility methods
  async getProductsCount(): Promise<number> {
    return this.productRepository.count();
  }

  async findByCategory(categoryId: number): Promise<Product[]> {
    return this.productRepository.find({
      where: { category: { id: categoryId } },
      relations: ['brand', 'images'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByBrand(brandId: number): Promise<Product[]> {
    return this.productRepository.find({
      where: { brand: { id: brandId } },
      relations: ['category', 'images'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateStock(id: number, newStock: number): Promise<Product> {
    if (newStock < 0) {
      throw new BadRequestException('Stock cannot be negative');
    }

    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    await this.productRepository.update(id, { stock: newStock });
    return this.findOne(id);
  }

  async getLowStockProducts(threshold = 10): Promise<Product[]> {
    return this.productRepository.find({
      where: {
        stock: threshold,
      },
      relations: ['category', 'brand'],
      order: { stock: 'ASC' },
    });
  }

  async findProductsInPriceRange(
    minPrice: number,
    maxPrice: number,
  ): Promise<Product[]> {
    if (minPrice < 0 || maxPrice < 0 || minPrice > maxPrice) {
      throw new BadRequestException('Invalid price range');
    }

    return this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.brand', 'brand')
      .where('product.price >= :minPrice AND product.price <= :maxPrice', {
        minPrice,
        maxPrice,
      })
      .orderBy('product.price', 'ASC')
      .getMany();
  }

  // Private helper methods
  private async handleAttributeValues(
    productId: number,
    attributeValueIds: number[],
  ): Promise<void> {
    // Validate all attribute values exist
    const attributeValues =
      await this.attributeValueRepository.findByIds(attributeValueIds);

    if (attributeValues.length !== attributeValueIds.length) {
      const foundIds = attributeValues.map((av) => av.id);
      const missingIds = attributeValueIds.filter(
        (id) => !foundIds.includes(id),
      );
      throw new NotFoundException(
        `Attribute values not found: ${missingIds.join(', ')}`,
      );
    }

    // Create product attribute value associations
    const productAttributeValues = attributeValues.map((attributeValue) =>
      this.productAttributeValueRepository.create({
        product: { id: productId } as Product,
        attributeValue,
      }),
    );

    await this.productAttributeValueRepository.save(productAttributeValues);
  }

  private async updateAttributeValues(
    productId: number,
    attributeValueIds: number[],
  ): Promise<void> {
    // Remove existing attribute values
    await this.productAttributeValueRepository.delete({
      product: { id: productId },
    });

    // Add new attribute values if provided
    if (attributeValueIds && attributeValueIds.length > 0) {
      await this.handleAttributeValues(productId, attributeValueIds);
    }
  }
}
