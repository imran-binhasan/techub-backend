import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductImage } from '../entity/product_image.entity';
import { PaginatedServiceResponse } from 'src/shared/interface/api-response.interface';
import { CreateProductImageDto } from '../dto/create-product_image.dto';
import { ProductImageQueryDto } from '../dto/query-product_image.dto';
import { UpdateProductImageDto } from '../dto/update-product_image.dto';
import { Product } from '../../product/entity/product.entity';

@Injectable()
export class ProductImageService {
  constructor(
    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(
    createProductImageDto: CreateProductImageDto,
  ): Promise<ProductImage> {
    const { productId, isPrimary, ...imageData } = createProductImageDto;

    // Check if product exists
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // If this is going to be the primary image, unset other primary images for the product
    if (isPrimary) {
      await this.unsetPrimaryImages(productId);
    }

    // Set sortOrder if not provided
    if (createProductImageDto.sortOrder === undefined) {
      const maxSortOrder = await this.getMaxSortOrder(productId);
      imageData.sortOrder = maxSortOrder + 1;
    }

    // Create product image
    const productImage = this.productImageRepository.create({
      ...imageData,
      isPrimary: isPrimary || false,
      product,
    });

    const savedImage = await this.productImageRepository.save(productImage);
    return this.findOne(savedImage.id);
  }

  async findAll(
    query: ProductImageQueryDto,
  ): Promise<PaginatedServiceResponse<ProductImage>> {
    const { page = 1, limit = 10, search, productId, isPrimary } = query;

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      throw new BadRequestException('Invalid pagination parameters');
    }

    const queryBuilder = this.productImageRepository
      .createQueryBuilder('productImage')
      .leftJoinAndSelect('productImage.product', 'product')
      .select([
        'productImage.id',
        'productImage.url',
        'productImage.altText',
        'productImage.isPrimary',
        'productImage.sortOrder',
        'productImage.createdAt',
        'productImage.updatedAt',
        'product.id',
        'product.name',
      ]);

    // Apply filters
    if (search?.trim()) {
      queryBuilder.andWhere(
        '(productImage.altText ILIKE :search OR product.name ILIKE :search)',
        { search: `%${search.trim()}%` },
      );
    }

    if (productId) {
      queryBuilder.andWhere('product.id = :productId', { productId });
    }

    if (isPrimary !== undefined) {
      queryBuilder.andWhere('productImage.isPrimary = :isPrimary', {
        isPrimary,
      });
    }

    // Apply pagination and ordering
    const [items, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('productImage.isPrimary', 'DESC')
      .addOrderBy('productImage.sortOrder', 'ASC')
      .addOrderBy('productImage.createdAt', 'DESC')
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

  async findOne(id: number): Promise<ProductImage> {
    const productImage = await this.productImageRepository.findOne({
      where: { id },
      relations: ['product'],
    });

    if (!productImage) {
      throw new NotFoundException(`Product image with ID ${id} not found`);
    }

    return productImage;
  }

  async findByProduct(productId: number): Promise<ProductImage[]> {
    return this.productImageRepository.find({
      where: { product: { id: productId } },
      relations: ['product'],
      order: { isPrimary: 'DESC', sortOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  async findPrimaryImage(productId: number): Promise<ProductImage | null> {
    return this.productImageRepository.findOne({
      where: { product: { id: productId }, isPrimary: true },
      relations: ['product'],
    });
  }

  async update(
    id: number,
    updateProductImageDto: UpdateProductImageDto,
  ): Promise<ProductImage> {
    const existingImage = await this.productImageRepository.findOne({
      where: { id },
      relations: ['product'],
    });

    if (!existingImage) {
      throw new NotFoundException(`Product image with ID ${id} not found`);
    }

    // If setting as primary, unset other primary images for the same product
    if (updateProductImageDto.isPrimary) {
      await this.unsetPrimaryImages(existingImage.product.id);
    }

    // Update product image
    await this.productImageRepository.update(id, updateProductImageDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const productImage = await this.productImageRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!productImage) {
      throw new NotFoundException(`Product image with ID ${id} not found`);
    }

    // Soft delete the product image
    await this.productImageRepository.softDelete(id);
  }

  async restore(id: number): Promise<ProductImage> {
    const productImage = await this.productImageRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!productImage) {
      throw new NotFoundException(`Product image with ID ${id} not found`);
    }

    if (!productImage.deletedAt) {
      throw new BadRequestException('Product image is not deleted');
    }

    await this.productImageRepository.restore(id);
    return this.findOne(id);
  }

  async setPrimary(id: number): Promise<ProductImage> {
    const productImage = await this.productImageRepository.findOne({
      where: { id },
      relations: ['product'],
    });

    if (!productImage) {
      throw new NotFoundException(`Product image with ID ${id} not found`);
    }

    // Unset other primary images for the same product
    await this.unsetPrimaryImages(productImage.product.id);

    // Set this image as primary
    await this.productImageRepository.update(id, { isPrimary: true });
    return this.findOne(id);
  }

  async reorderImages(
    productId: number,
    imageIds: number[],
  ): Promise<ProductImage[]> {
    // Validate that all image IDs belong to the product
    const images = await this.productImageRepository.find({
      where: { product: { id: productId } },
    });

    const existingImageIds = images.map((img) => img.id);
    const invalidIds = imageIds.filter((id) => !existingImageIds.includes(id));

    if (invalidIds.length > 0) {
      throw new BadRequestException(
        `Invalid image IDs: ${invalidIds.join(', ')}`,
      );
    }

    // Update sort order for each image
    const updatePromises = imageIds.map((imageId, index) =>
      this.productImageRepository.update(imageId, { sortOrder: index }),
    );

    await Promise.all(updatePromises);

    return this.findByProduct(productId);
  }

  async getImagesCount(productId: number): Promise<number> {
    return this.productImageRepository.count({
      where: { product: { id: productId } },
    });
  }

  // Private helper methods
  private async unsetPrimaryImages(productId: number): Promise<void> {
    await this.productImageRepository.update(
      { product: { id: productId } },
      { isPrimary: false },
    );
  }

  private async getMaxSortOrder(productId: number): Promise<number> {
    const result = await this.productImageRepository
      .createQueryBuilder('productImage')
      .where('productImage.product.id = :productId', { productId })
      .select('MAX(productImage.sortOrder)', 'maxSortOrder')
      .getRawOne();

    return result?.maxSortOrder || 0;
  }
}
