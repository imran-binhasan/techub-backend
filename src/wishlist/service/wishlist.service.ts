import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wishlist } from '../entity/wishlist.entity';
import { Customer } from 'src/customer/entity/customer.entity';
import { Product } from 'src/product/entity/product.entity';
import { CreateWishlistDto } from '../dto/create-wishlist.dto';
import { UpdateWishlistDto } from '../dto/update-wishlist.dto';
import { WishlistQueryDto } from '../dto/query-wishlist.dto';
import {
  PaginatedServiceResponse,
} from 'src/common/interface/api-response.interface';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(Wishlist)
    private readonly wishlistRepository: Repository<Wishlist>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(createWishlistDto: CreateWishlistDto): Promise<Wishlist> {
    const { customerId, productId } = createWishlistDto;

    // Check if customer exists
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    // Check if product exists
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // Check if wishlist item already exists
    const existingWishlist = await this.wishlistRepository.findOne({
      where: { customer: { id: customerId }, product: { id: productId } },
    });

    if (existingWishlist) {
      throw new ConflictException('Product is already in wishlist');
    }

    // Create wishlist item
    const wishlist = this.wishlistRepository.create({
      customer,
      product,
    });

    const savedWishlist = await this.wishlistRepository.save(wishlist);
    return this.findOne(savedWishlist.id);
  }

  async findAll(query: WishlistQueryDto): Promise<PaginatedServiceResponse<Wishlist>> {
    const {
      page = 1,
      limit = 10,
      search,
      customerId,
      productId,
    } = query;

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      throw new BadRequestException('Invalid pagination parameters');
    }

    const queryBuilder = this.wishlistRepository
      .createQueryBuilder('wishlist')
      .leftJoinAndSelect('wishlist.customer', 'customer')
      .leftJoinAndSelect('wishlist.product', 'product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.images', 'images')
      .select([
        'wishlist.id',
        'wishlist.createdAt',
        'wishlist.updatedAt',
        'customer.id',
        'customer.firstName',
        'customer.lastName',
        'customer.email',
        'product.id',
        'product.name',
        'product.description',
        'product.price',
        'product.stock',
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
        '(product.name ILIKE :search OR product.description ILIKE :search OR customer.firstName ILIKE :search OR customer.lastName ILIKE :search)',
        { search: `%${search.trim()}%` },
      );
    }

    if (customerId) {
      queryBuilder.andWhere('customer.id = :customerId', { customerId });
    }

    if (productId) {
      queryBuilder.andWhere('product.id = :productId', { productId });
    }

    // Apply pagination and ordering
    const [items, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('wishlist.createdAt', 'DESC')
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

  async findOne(id: string): Promise<Wishlist> {
    const wishlist = await this.wishlistRepository.findOne({
      where: { id },
      relations: [
        'customer',
        'product',
        'product.category',
        'product.brand',
        'product.images',
      ],
    });

    if (!wishlist) {
      throw new NotFoundException(`Wishlist item with ID ${id} not found`);
    }

    return wishlist;
  }

  async update(id: string, updateWishlistDto: UpdateWishlistDto): Promise<Wishlist> {
    const existingWishlist = await this.wishlistRepository.findOne({
      where: { id },
      relations: ['customer', 'product'],
    });

    if (!existingWishlist) {
      throw new NotFoundException(`Wishlist item with ID ${id} not found`);
    }

    // Validate customer if being updated
    let customer = existingWishlist.customer;
    if (updateWishlistDto.customerId) {
      const foundCustomer = await this.customerRepository.findOne({
        where: { id: updateWishlistDto.customerId },
      });

      if (!foundCustomer) {
        throw new NotFoundException(`Customer with ID ${updateWishlistDto.customerId} not found`);
      }
      customer = foundCustomer;
    }

    // Validate product if being updated
    let product = existingWishlist.product;
    if (updateWishlistDto.productId) {
      const foundProduct = await this.productRepository.findOne({
        where: { id: updateWishlistDto.productId },
      });

      if (!foundProduct) {
        throw new NotFoundException(`Product with ID ${updateWishlistDto.productId} not found`);
      }
      product = foundProduct;

      // Check if this combination already exists
      if (updateWishlistDto.customerId || updateWishlistDto.productId) {
        const customerId = updateWishlistDto.customerId || existingWishlist.customer.id;
        const productId = updateWishlistDto.productId || existingWishlist.product.id;
        
        const duplicate = await this.wishlistRepository.findOne({
          where: { customer: { id: customerId }, product: { id: productId } },
        });

        if (duplicate && duplicate.id !== id) {
          throw new ConflictException('This product is already in the customer\'s wishlist');
        }
      }
    }

    // Update wishlist
    if (updateWishlistDto.customerId) {
      existingWishlist.customer = customer;
    }
    if (updateWishlistDto.productId) {
      existingWishlist.product = product;
    }

    await this.wishlistRepository.save(existingWishlist);
    return this.findOne(id);
  }

  async findByCustomerId(customerId: string): Promise<Wishlist[]> {
    return this.wishlistRepository.find({
      where: { customer: { id: customerId } },
      relations: ['product', 'product.category', 'product.brand', 'product.images'],
      order: { createdAt: 'DESC' },
    });
  }

  async remove(id: string): Promise<void> {
    const wishlist = await this.wishlistRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!wishlist) {
      throw new NotFoundException(`Wishlist item with ID ${id} not found`);
    }

    // Soft delete the wishlist item
    await this.wishlistRepository.softDelete(id);
  }

  async restore(id: string): Promise<Wishlist> {
    const wishlist = await this.wishlistRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!wishlist) {
      throw new NotFoundException(`Wishlist item with ID ${id} not found`);
    }

    if (!wishlist.deletedAt) {
      throw new BadRequestException('Wishlist item is not deleted');
    }

    await this.wishlistRepository.restore(id);
    return this.findOne(id);
  }

  async removeByCustomerAndProduct(customerId: string, productId: string): Promise<void> {
    const wishlist = await this.wishlistRepository.findOne({
      where: { customer: { id: customerId }, product: { id: productId } },
    });

    if (!wishlist) {
      throw new NotFoundException('Wishlist item not found');
    }

    await this.wishlistRepository.remove(wishlist);
  }

  async clearCustomerWishlist(customerId: string): Promise<void> {
    await this.wishlistRepository.delete({ customer: { id: customerId } });
  }

  async getWishlistCount(customerId: string): Promise<number> {
    return this.wishlistRepository.count({
      where: { customer: { id: customerId } },
    });
  }

  async isProductInWishlist(customerId: string, productId: string): Promise<boolean> {
    const count = await this.wishlistRepository.count({
      where: { customer: { id: customerId }, product: { id: productId } },
    });
    return count > 0;
  }
}