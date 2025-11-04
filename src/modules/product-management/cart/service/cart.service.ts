import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from '../entity/cart.entity';
import { PaginatedServiceResponse } from 'src/shared/interface/api-response.interface';
import { CreateCartDto } from '../dto/create-cart.dto';
import { CartQueryDto } from '../dto/query-cart.dto';
import { UpdateCartDto } from '../dto/update-cart.dto';
import { Customer } from 'src/modules/personnel-management/customer/entity/customer.entity';
import { Product } from '../../product/entity/product.entity';
import { CacheService } from 'src/core/cache/service/cache.service';

// Cache constants - Short TTLs for free Redis version
const CART_CACHE_TTL = {
  CUSTOMER_CART: 300, // 5 minutes - frequently updated
  CART_TOTAL: 300, // 5 minutes
  CART_COUNT: 180, // 3 minutes
};

const CART_CACHE_KEYS = {
  CUSTOMER_ITEMS: 'customer', // cart:customer:{id}
  TOTAL: 'total', // cart:total:{customerId}
  COUNT: 'count', // cart:count:{customerId}
};

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Invalidate all cart-related caches for a customer
   * Optimized for free Redis - only invalidates customer-specific keys
   */
  private async invalidateCustomerCartCaches(customerId: number): Promise<void> {
    try {
      await Promise.all([
        this.cacheService.del('cart', `${CART_CACHE_KEYS.CUSTOMER_ITEMS}:${customerId}`),
        this.cacheService.del('cart', `${CART_CACHE_KEYS.TOTAL}:${customerId}`),
        this.cacheService.del('cart', `${CART_CACHE_KEYS.COUNT}:${customerId}`),
      ]);
      this.logger.debug(`Invalidated cart caches for customer ${customerId}`);
    } catch (error) {
      this.logger.warn(`Failed to invalidate cart caches: ${error.message}`);
    }
  }

  async addToCart(
    customerId: number,
    createCartDto: CreateCartDto,
  ): Promise<Cart> {
    // Verify customer exists
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException(
        `Customer with ID ${customerId} not found or inactive`,
      );
    }

    // Verify product exists and has sufficient stock
    const product = await this.productRepository.findOne({
      where: { id: createCartDto.productId },
    });

    if (!product) {
      throw new NotFoundException(
        `Product with ID ${createCartDto.productId} not found`,
      );
    }

    const requestedQuantity = createCartDto.quantity || 1;
    if (product.stock < requestedQuantity) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${product.stock}, Requested: ${requestedQuantity}`,
      );
    }

    // Check if product already exists in customer's cart
    const existingCartItem = await this.cartRepository.findOne({
      where: {
        customerId: customerId,
        productId: createCartDto.productId,
      },
    });

    if (existingCartItem) {
      // Update quantity if item already exists
      const newQuantity = existingCartItem.quantity + requestedQuantity;

      if (product.stock < newQuantity) {
        throw new BadRequestException(
          `Insufficient stock. Available: ${product.stock}, Total requested: ${newQuantity}`,
        );
      }

      existingCartItem.quantity = newQuantity;
      const updatedCart = await this.cartRepository.save(existingCartItem);
      
      // Invalidate customer cart caches
      await this.invalidateCustomerCartCaches(customerId);
      
      return this.findOne(updatedCart.id);
    }

    // Create new cart item
    const cartItem = this.cartRepository.create({
      customerId: customerId,
      productId: createCartDto.productId,
      quantity: requestedQuantity,
    });

    const savedCart = await this.cartRepository.save(cartItem);
    
    // Invalidate customer cart caches
    await this.invalidateCustomerCartCaches(customerId);
    
    return this.findOne(savedCart.id);
  }

  async findAll(query: CartQueryDto): Promise<PaginatedServiceResponse<Cart>> {
    const { page = 1, limit = 10, search, customerId, productId } = query;

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      throw new BadRequestException('Invalid pagination parameters');
    }

    const queryBuilder = this.cartRepository
      .createQueryBuilder('cart')
      .leftJoinAndSelect('cart.customer', 'customer')
      .leftJoinAndSelect('cart.product', 'product');

    // Apply customer filter
    if (customerId) {
      queryBuilder.where('cart.customerId = :customerId', { customerId });
    }

    // Apply product filter
    if (productId) {
      queryBuilder.andWhere('cart.productId = :productId', { productId });
    }

    // Apply search filter
    if (search?.trim()) {
      queryBuilder.andWhere(
        '(customer.firstName ILIKE :search OR customer.lastName ILIKE :search OR product.name ILIKE :search)',
        { search: `%${search.trim()}%` },
      );
    }

    // Apply pagination and ordering
    const [items, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('cart.createdAt', 'DESC')
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

  async findOne(id: number): Promise<Cart> {
    const cart = await this.cartRepository.findOne({
      where: { id },
      relations: ['customer', 'product'],
    });

    if (!cart) {
      throw new NotFoundException(`Cart item with ID ${id} not found`);
    }

    return cart;
  }

  async findByCustomer(customerId: number): Promise<Cart[]> {
    // Check cache first - short TTL for free Redis
    const cacheKey = `${CART_CACHE_KEYS.CUSTOMER_ITEMS}:${customerId}`;
    const cached = await this.cacheService.get<Cart[]>('cart', cacheKey);

    if (cached) {
      this.logger.debug(`Cache HIT for customer ${customerId} cart`);
      return cached;
    }

    this.logger.debug(`Cache MISS for customer ${customerId} cart`);

    // Verify customer exists
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    const cartItems = await this.cartRepository.find({
      where: { customerId },
      relations: ['product'],
      order: { createdAt: 'DESC' },
    });

    // Cache with 5-minute TTL (short for frequently changing data)
    if (cartItems.length > 0) {
      await this.cacheService.set('cart', cacheKey, cartItems, {
        ttl: CART_CACHE_TTL.CUSTOMER_CART,
      });
    }

    return cartItems;
  }

  async updateQuantity(
    id: number,
    updateCartDto: UpdateCartDto,
  ): Promise<Cart> {
    const cartItem = await this.cartRepository.findOne({
      where: { id },
      relations: ['product'],
    });

    if (!cartItem) {
      throw new NotFoundException(`Cart item with ID ${id} not found`);
    }

    // Check if product has sufficient stock
    if (cartItem.product.stock < updateCartDto.quantity) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${cartItem.product.stock}, Requested: ${updateCartDto.quantity}`,
      );
    }

    // Update quantity
    await this.cartRepository.update(id, { quantity: updateCartDto.quantity });
    
    // Invalidate customer cart caches
    await this.invalidateCustomerCartCaches(cartItem.customerId);
    
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const cartItem = await this.cartRepository.findOne({
      where: { id },
    });

    if (!cartItem) {
      throw new NotFoundException(`Cart item with ID ${id} not found`);
    }

    const customerId = cartItem.customerId;
    await this.cartRepository.delete(id);
    
    // Invalidate customer cart caches
    await this.invalidateCustomerCartCaches(customerId);
  }

  async clearCart(customerId: number): Promise<void> {
    // Verify customer exists
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    await this.cartRepository.delete({ customerId });
    
    // Invalidate customer cart caches
    await this.invalidateCustomerCartCaches(customerId);
  }

  // Utility methods
  async getCartTotal(
    customerId: number,
  ): Promise<{ total: number; items: number }> {
    // Check cache first - this is frequently called
    const cacheKey = `${CART_CACHE_KEYS.TOTAL}:${customerId}`;
    const cached = await this.cacheService.get<{ total: number; items: number }>('cart', cacheKey);

    if (cached) {
      this.logger.debug(`Cache HIT for customer ${customerId} cart total`);
      return cached;
    }

    this.logger.debug(`Cache MISS for customer ${customerId} cart total`);

    const cartItems = await this.cartRepository.find({
      where: { customerId },
      relations: ['product'],
    });

    const total = cartItems.reduce((sum, item) => {
      return sum + item.product.price * item.quantity;
    }, 0);

    const items = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    const result = { total, items };

    // Cache with 5-minute TTL
    await this.cacheService.set('cart', cacheKey, result, {
      ttl: CART_CACHE_TTL.CART_TOTAL,
    });

    return result;
  }

  async getCartItemsCount(customerId: number): Promise<number> {
    // Check cache first
    const cacheKey = `${CART_CACHE_KEYS.COUNT}:${customerId}`;
    const cached = await this.cacheService.get<number>('cart', cacheKey);

    if (cached !== null && cached !== undefined) {
      this.logger.debug(`Cache HIT for customer ${customerId} cart count`);
      return cached;
    }

    this.logger.debug(`Cache MISS for customer ${customerId} cart count`);

    const count = await this.cartRepository.count({
      where: { customerId },
    });

    // Cache with 3-minute TTL (very short for frequently changing data)
    await this.cacheService.set('cart', cacheKey, count, {
      ttl: CART_CACHE_TTL.CART_COUNT,
    });

    return count;
  }

  async findCartItemByProductAndCustomer(
    customerId: number,
    productId: number,
  ): Promise<Cart | null> {
    return this.cartRepository.findOne({
      where: {
        customerId,
        productId,
      },
      relations: ['product', 'customer'],
    });
  }

  async bulkUpdateQuantities(
    updates: { id: number; quantity: number }[],
  ): Promise<Cart[]> {
    const updatedItems: Cart[] = [];

    for (const update of updates) {
      try {
        const updatedItem = await this.updateQuantity(update.id, {
          quantity: update.quantity,
        });
        updatedItems.push(updatedItem);
      } catch (error) {
        // Continue with other items if one fails
        console.error(
          `Failed to update cart item ${update.id}:`,
          error.message,
        );
      }
    }

    return updatedItems;
  }

  async moveToCart(
    customerId: number,
    fromCustomerId: number,
  ): Promise<Cart[]> {
    // Verify both customers exist
    const [customer, fromCustomer] = await Promise.all([
      this.customerRepository.findOne({ where: { id: customerId } }),
      this.customerRepository.findOne({ where: { id: fromCustomerId } }),
    ]);

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    if (!fromCustomer) {
      throw new NotFoundException(
        `Source customer with ID ${fromCustomerId} not found`,
      );
    }

    // Get cart items from source customer
    const sourceCartItems = await this.cartRepository.find({
      where: { customerId: fromCustomerId },
      relations: ['product'],
    });

    if (sourceCartItems.length === 0) {
      return [];
    }

    // Move items to target customer's cart
    const movedItems: Cart[] = [];
    for (const item of sourceCartItems) {
      try {
        const newCartItem = await this.addToCart(customerId, {
          productId: item.productId,
          quantity: item.quantity,
        });
        movedItems.push(newCartItem);

        // Remove from source cart
        await this.cartRepository.delete(item.id);
      } catch (error) {
        console.error(`Failed to move cart item ${item.id}:`, error.message);
      }
    }

    return movedItems;
  }
}
