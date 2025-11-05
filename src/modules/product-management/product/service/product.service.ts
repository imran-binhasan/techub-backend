// src/product/service/product.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThan, MoreThan } from 'typeorm';
import { Product } from '../entity/product.entity';
import { ProductAttributeValue } from '../entity/product_attribute_value.entity';
import { Category } from 'src/modules/product-management/category/entity/category.entity';
import { Brand } from 'src/modules/product-management/brand/entity/brand.entity';
import { AttributeValue } from 'src/modules/product-management/attribute_value/entity/attribute_value.entity';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ProductQueryDto } from '../dto/query-product.dto';
import { PaginatedServiceResponse } from 'src/shared/interface/api-response.interface';
import {
  ProductStatus,
  ProductCondition,
  ProductVisibility,
  DiscountType,
} from '../enum/product.enum';
import {
  PRODUCT_VALIDATION,
  PRODUCT_DEFAULTS,
  STOCK_THRESHOLDS,
  PRODUCT_ANALYTICS,
  PRODUCT_CACHE_TTL,
  PRODUCT_CACHE_KEYS,
} from '../constants/product.constants';
import {
  generateSlug,
  generateUniqueSlugAsync,
  generateSKU,
  isValidSKU,
  isValidSlug,
} from '../utils/slug.util';
import { CacheService } from 'src/core/cache/service/cache.service';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

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
    private readonly cacheService: CacheService,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    // Check if product with same name already exists
    const existingProduct = await this.productRepository.findOne({
      where: { name: createProductDto.name },
      withDeleted: true,
    });

    if (existingProduct) {
      throw new ConflictException(
        `Product with name '${createProductDto.name}' already exists`,
      );
    }

    // Generate or validate SKU
    let sku = createProductDto.sku;
    if (sku) {
      // Validate provided SKU
      if (!isValidSKU(sku)) {
        throw new BadRequestException(`Invalid SKU format: ${sku}`);
      }
      // Check SKU uniqueness
      const existingSKU = await this.productRepository.findOne({
        where: { sku },
        withDeleted: true,
      });
      if (existingSKU) {
        throw new ConflictException(`Product with SKU '${sku}' already exists`);
      }
    } else {
      // Auto-generate SKU
      const categoryCode = createProductDto.categoryId
        ? `CAT${createProductDto.categoryId}`
        : 'PROD';
      sku = generateSKU({
        categoryCode,
        productName: createProductDto.name,
        randomSuffix: true,
      });
    }

    // Generate or validate slug
    let slug = createProductDto.slug;
    if (slug) {
      // Validate provided slug
      if (!isValidSlug(slug)) {
        throw new BadRequestException(
          `Invalid slug format: ${slug}. Must be lowercase with hyphens only`,
        );
      }
      // Check slug uniqueness
      const existingSlug = await this.productRepository.findOne({
        where: { slug },
        withDeleted: true,
      });
      if (existingSlug) {
        throw new ConflictException(
          `Product with slug '${slug}' already exists`,
        );
      }
    } else {
      // Auto-generate unique slug from name
      slug = await generateUniqueSlugAsync(
        createProductDto.name,
        async (checkSlug) => {
          const existing = await this.productRepository.findOne({
            where: { slug: checkSlug },
            withDeleted: true,
          });
          return !!existing;
        },
      );
    }

    // Validate price
    if (createProductDto.price < PRODUCT_VALIDATION.PRICE.MIN) {
      throw new BadRequestException(
        `Price cannot be negative. Got: ${createProductDto.price}`,
      );
    }

    // Validate and fetch category
    let category: Category | undefined | null = null;
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
    let brand: Brand | undefined | null = null;
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

    // Create product with all fields
    const product = this.productRepository.create({
      name: createProductDto.name,
      description: createProductDto.description,
      sku,
      slug,
      status: (createProductDto.status ||
        PRODUCT_DEFAULTS.STATUS) as ProductStatus,
      condition: (createProductDto.condition ||
        PRODUCT_DEFAULTS.CONDITION) as ProductCondition,
      visibility: (createProductDto.visibility ||
        PRODUCT_DEFAULTS.VISIBILITY) as ProductVisibility,
      stock: createProductDto.stock,
      price: createProductDto.price,
      compareAtPrice: createProductDto.compareAtPrice,
      costPerItem: createProductDto.costPerItem,
      discountType: (createProductDto.discountType ||
        PRODUCT_DEFAULTS.DISCOUNT_TYPE) as DiscountType,
      discountValue:
        createProductDto.discountValue || PRODUCT_DEFAULTS.DISCOUNT_VALUE,
      metaTitle: createProductDto.metaTitle,
      metaDescription: createProductDto.metaDescription,
      keywords: createProductDto.keywords,
      isFeatured: createProductDto.isFeatured || PRODUCT_DEFAULTS.IS_FEATURED,
      isPublished:
        createProductDto.isPublished || PRODUCT_DEFAULTS.IS_PUBLISHED,
      avgRating: PRODUCT_DEFAULTS.AVG_RATING,
      reviewCount: PRODUCT_DEFAULTS.REVIEW_COUNT,
      viewCount: PRODUCT_DEFAULTS.VIEW_COUNT,
      salesCount: PRODUCT_DEFAULTS.SALES_COUNT,
      category: category || undefined,
      brand: brand || undefined,
      categoryId: category?.id,
      brandId: brand?.id,
      vendorId: createProductDto.vendorId,
    });

    const savedProduct = await this.productRepository.save(product);

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

    // Invalidate related caches
    await this.invalidateProductCaches(savedProduct.id, savedProduct);

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
    // Try to get from cache first
    const cacheKey = `${PRODUCT_CACHE_KEYS.SINGLE}:${id}`;
    const cached = await this.cacheService.get<Product>('products', cacheKey);

    if (cached) {
      this.logger.debug(`Cache HIT for product ${id}`);
      return cached;
    }

    this.logger.debug(`Cache MISS for product ${id}`);
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

    // Cache the product
    await this.cacheService.set('products', cacheKey, product, {
      ttl: PRODUCT_CACHE_TTL.SINGLE_PRODUCT,
    });

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
    let category: Category | undefined | null =
      existingProduct.category || null;
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
    let brand: Brand | undefined | null = existingProduct.brand || null;
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

    // Invalidate caches
    const updatedProduct = await this.productRepository.findOne({
      where: { id },
      relations: ['category', 'brand'],
    });
    if (updatedProduct) {
      await this.invalidateProductCaches(id, updatedProduct);
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

    // Invalidate caches
    await this.invalidateProductCaches(id, product);
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

    // Invalidate caches
    await this.invalidateProductCaches(id, product);

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

  // Analytics and tracking methods
  async incrementViewCount(id: number): Promise<void> {
    await this.productRepository.increment({ id }, 'viewCount', 1);
  }

  async incrementSalesCount(id: number, quantity: number = 1): Promise<void> {
    await this.productRepository.increment({ id }, 'salesCount', quantity);
  }

  // Featured, popular, and trending products
  async getFeaturedProducts(limit: number = 10): Promise<Product[]> {
    const cacheKey = `${PRODUCT_CACHE_KEYS.FEATURED}:${limit}`;
    const cached = await this.cacheService.get<Product[]>('products', cacheKey);

    if (cached) {
      this.logger.debug(`Cache HIT for featured products`);
      return cached;
    }

    this.logger.debug(`Cache MISS for featured products`);
    const products = await this.productRepository.find({
      where: {
        isFeatured: true,
        isPublished: true,
        status: ProductStatus.ACTIVE,
      },
      relations: ['category', 'brand', 'images'],
      order: { viewCount: 'DESC' },
      take: limit,
    });

    // Cache for 30 minutes
    await this.cacheService.set('products', cacheKey, products, {
      ttl: PRODUCT_CACHE_TTL.FEATURED_PRODUCTS,
    });

    return products;
  }

  async getPopularProducts(limit: number = 10): Promise<Product[]> {
    const cacheKey = `${PRODUCT_CACHE_KEYS.POPULAR}:${limit}`;
    const cached = await this.cacheService.get<Product[]>('products', cacheKey);

    if (cached) {
      this.logger.debug(`Cache HIT for popular products`);
      return cached;
    }

    this.logger.debug(`Cache MISS for popular products`);
    const products = await this.productRepository.find({
      where: {
        isPublished: true,
        status: ProductStatus.ACTIVE,
      },
      relations: ['category', 'brand', 'images'],
      order: { viewCount: 'DESC' },
      take: limit,
    });

    // Cache for 30 minutes
    await this.cacheService.set('products', cacheKey, products, {
      ttl: PRODUCT_CACHE_TTL.POPULAR_PRODUCTS,
    });

    return products;
  }

  async getTrendingProducts(limit: number = 10): Promise<Product[]> {
    const cacheKey = `${PRODUCT_CACHE_KEYS.TRENDING}:${limit}`;
    const cached = await this.cacheService.get<Product[]>('products', cacheKey);

    if (cached) {
      this.logger.debug(`Cache HIT for trending products`);
      return cached;
    }

    this.logger.debug(`Cache MISS for trending products`);
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - PRODUCT_ANALYTICS.TRENDING_PERIOD_DAYS);

    const products = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.images', 'images')
      .where('product.isPublished = :isPublished', { isPublished: true })
      .andWhere('product.status = :status', { status: ProductStatus.ACTIVE })
      .andWhere('product.updatedAt >= :daysAgo', { daysAgo })
      .orderBy('product.salesCount', 'DESC')
      .addOrderBy('product.viewCount', 'DESC')
      .take(limit)
      .getMany();

    // Cache for 30 minutes
    await this.cacheService.set('products', cacheKey, products, {
      ttl: PRODUCT_CACHE_TTL.POPULAR_PRODUCTS,
    });

    return products;
  }

  async getRelatedProducts(
    productId: number,
    limit: number = 6,
  ): Promise<Product[]> {
    const product = await this.findOne(productId);

    return this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.images', 'images')
      .where('product.id != :productId', { productId })
      .andWhere('product.categoryId = :categoryId', {
        categoryId: product.categoryId,
      })
      .andWhere('product.isPublished = :isPublished', { isPublished: true })
      .andWhere('product.status = :status', { status: ProductStatus.ACTIVE })
      .orderBy('product.avgRating', 'DESC')
      .addOrderBy('product.viewCount', 'DESC')
      .take(limit)
      .getMany();
  }

  // Search and lookup methods
  async searchProducts(
    searchTerm: string,
    limit: number = 20,
  ): Promise<Product[]> {
    return this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.images', 'images')
      .where('product.isPublished = :isPublished', { isPublished: true })
      .andWhere('product.status = :status', { status: ProductStatus.ACTIVE })
      .andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search OR product.sku ILIKE :search OR product.keywords::text ILIKE :search)',
        { search: `%${searchTerm}%` },
      )
      .orderBy('product.avgRating', 'DESC')
      .addOrderBy('product.viewCount', 'DESC')
      .take(limit)
      .getMany();
  }

  async findBySlug(slug: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { slug },
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
      throw new NotFoundException(`Product with slug '${slug}' not found`);
    }

    // Increment view count asynchronously
    this.incrementViewCount(product.id).catch(() => {
      // Silently fail - view count is not critical
    });

    return product;
  }

  async findBySKU(sku: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { sku },
      relations: ['category', 'brand', 'images'],
    });

    if (!product) {
      throw new NotFoundException(`Product with SKU '${sku}' not found`);
    }

    return product;
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

  /**
   * Invalidate all caches related to a product
   * This includes: single product, featured, popular, trending, category, brand lists
   */
  private async invalidateProductCaches(
    productId: number,
    product: Product,
  ): Promise<void> {
    try {
      // Invalidate single product cache
      const singleKey = `${PRODUCT_CACHE_KEYS.SINGLE}:${productId}`;
      await this.cacheService.del('products', singleKey);
      this.logger.debug(`Invalidated cache for product ${productId}`);

      // Invalidate featured products cache if product is featured
      if (product.isFeatured) {
        await this.cacheService.deleteByPattern(
          'products',
          `${PRODUCT_CACHE_KEYS.FEATURED}:*`,
        );
        this.logger.debug(`Invalidated featured products cache`);
      }

      // Invalidate popular products cache
      await this.cacheService.deleteByPattern(
        'products',
        `${PRODUCT_CACHE_KEYS.POPULAR}:*`,
      );
      this.logger.debug(`Invalidated popular products cache`);

      // Invalidate trending products cache
      await this.cacheService.deleteByPattern(
        'products',
        `${PRODUCT_CACHE_KEYS.TRENDING}:*`,
      );
      this.logger.debug(`Invalidated trending products cache`);

      // Invalidate category-based caches if product has category
      if (product.categoryId) {
        await this.cacheService.deleteByPattern(
          'products',
          `category:${product.categoryId}:*`,
        );
        this.logger.debug(`Invalidated category ${product.categoryId} cache`);
      }

      // Invalidate brand-based caches if product has brand
      if (product.brandId) {
        await this.cacheService.deleteByPattern(
          'products',
          `brand:${product.brandId}:*`,
        );
        this.logger.debug(`Invalidated brand ${product.brandId} cache`);
      }

      // Invalidate search results cache (all search queries)
      await this.cacheService.deleteByPattern(
        'products',
        `${PRODUCT_CACHE_KEYS.SEARCH}:*`,
      );
      this.logger.debug(`Invalidated search cache`);

      // Invalidate slug and SKU caches
      if (product.slug) {
        await this.cacheService.del('products', `slug:${product.slug}`);
      }
      if (product.sku) {
        await this.cacheService.del('products', `sku:${product.sku}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to invalidate caches for product ${productId}`,
        error,
      );
      // Don't throw - cache invalidation failures shouldn't break the operation
    }
  }

  /**
   * Warm up cache for frequently accessed products
   */
  async warmUpCache(): Promise<void> {
    this.logger.log('Starting cache warm-up...');

    try {
      // Warm up featured products
      await this.getFeaturedProducts(10);
      await this.getFeaturedProducts(20);

      // Warm up popular products
      await this.getPopularProducts(10);
      await this.getPopularProducts(20);

      // Warm up trending products
      await this.getTrendingProducts(10);

      this.logger.log('Cache warm-up completed successfully');
    } catch (error) {
      this.logger.error('Cache warm-up failed', error);
    }
  }
}
