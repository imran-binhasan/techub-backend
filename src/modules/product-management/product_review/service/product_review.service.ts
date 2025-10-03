// src/product-review/service/product-review.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Product } from 'src/product-management/product/entity/product.entity';
import { ProductReview } from '../entity/product_review.entity';
import { CreateProductReviewDto } from '../dto/create-product_review.dto';
import { ProductReviewQueryDto } from '../dto/query-product_review.dto';
import { UpdateProductReviewDto } from '../dto/update-product_review.dto';

@Injectable()
export class ProductReviewService {
  constructor(
    @InjectRepository(ProductReview)
    private readonly productReviewRepository: Repository<ProductReview>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(
    createProductReviewDto: CreateProductReviewDto,
  ): Promise<ProductReview> {
    const { productId, ...reviewData } = createProductReviewDto;

    // Verify product exists
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const productReview = this.productReviewRepository.create({
      ...reviewData,
      product,
    });

    return await this.productReviewRepository.save(productReview);
  }

  async findAll(query: ProductReviewQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      productId,
      rating,
      minRating,
      maxRating,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    const queryBuilder = this.productReviewRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.product', 'product')
      .where('review.deletedAt IS NULL');

    // Search functionality
    if (search) {
      queryBuilder.andWhere(
        '(review.name ILIKE :search OR review.comment ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Filter by product
    if (productId) {
      queryBuilder.andWhere('product.id = :productId', { productId });
    }

    // Filter by exact rating
    if (rating !== undefined) {
      queryBuilder.andWhere('review.rating = :rating', { rating });
    }

    // Filter by rating range
    if (minRating !== undefined) {
      queryBuilder.andWhere('review.rating >= :minRating', { minRating });
    }

    if (maxRating !== undefined) {
      queryBuilder.andWhere('review.rating <= :maxRating', { maxRating });
    }

    // Sorting
    const allowedSortFields = ['createdAt', 'updatedAt', 'rating', 'name'];
    if (allowedSortFields.includes(sortBy)) {
      queryBuilder.orderBy(`review.${sortBy}`, sortOrder);
    } else {
      queryBuilder.orderBy('review.createdAt', 'DESC');
    }

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [reviews, total] = await queryBuilder.getManyAndCount();

    return {
      data: reviews,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<ProductReview> {
    const review = await this.productReviewRepository.findOne({
      where: { id },
      relations: ['product'],
    });

    if (!review) {
      throw new NotFoundException('Product review not found');
    }

    return review;
  }

  async update(
    id: string,
    updateProductReviewDto: UpdateProductReviewDto,
  ): Promise<ProductReview> {
    const review = await this.findOne(id);

    const { productId, ...updateData } = updateProductReviewDto;

    // If productId is being updated, verify the new product exists
    if (productId && productId !== review.product.id) {
      const product = await this.productRepository.findOne({
        where: { id: productId },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      review.product = product;
    }

    Object.assign(review, updateData);
    return await this.productReviewRepository.save(review);
  }

  async remove(id: string): Promise<void> {
    const review = await this.findOne(id);
    await this.productReviewRepository.softDelete(review.id);
  }

  async restore(id: string): Promise<ProductReview> {
    const result = await this.productReviewRepository.restore(id);

    if (result.affected === 0) {
      throw new NotFoundException('Product review not found or not deleted');
    }

    return await this.findOne(id);
  }

  async findByProduct(productId: string, query: ProductReviewQueryDto) {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return await this.findAll({ ...query, productId });
  }

  async getAverageRating(productId: string): Promise<number> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const result = await this.productReviewRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'average')
      .where('review.product.id = :productId', { productId })
      .andWhere('review.deletedAt IS NULL')
      .getRawOne();

    return parseFloat(result.average) || 0;
  }

  async getReviewsCount(): Promise<number> {
    return await this.productReviewRepository.count({
      where: { deletedAt: IsNull() },
    });
  }

  async getReviewsByRating(): Promise<{ rating: number; count: number }[]> {
    const result = await this.productReviewRepository
      .createQueryBuilder('review')
      .select('review.rating', 'rating')
      .addSelect('COUNT(*)', 'count')
      .where('review.deletedAt IS NULL')
      .groupBy('review.rating')
      .orderBy('review.rating', 'ASC')
      .getRawMany();

    return result.map((item) => ({
      rating: parseInt(item.rating),
      count: parseInt(item.count),
    }));
  }
}
