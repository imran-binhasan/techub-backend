// src/cart/service/cart.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from '../entity/cart.entity';
import { Customer } from 'src/user-management/customer/entity/customer.entity';
import { Product } from 'src/product-management/product/entity/product.entity';
import { PaginatedServiceResponse } from 'src/shared/interface/api-response.interface';
import { CreateCartDto } from '../dto/create-cart.dto';
import { CartQueryDto } from '../dto/query-cart.dto';
import { UpdateCartDto } from '../dto/update-cart.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async addToCart(
    customerId: string,
    createCartDto: CreateCartDto,
  ): Promise<Cart> {
    // Verify customer exists
    const customer = await this.customerRepository.findOne({
      where: { id: customerId, isActive: true },
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
      return this.findOne(updatedCart.id);
    }

    // Create new cart item
    const cartItem = this.cartRepository.create({
      customerId: customerId,
      productId: createCartDto.productId,
      quantity: requestedQuantity,
    });

    const savedCart = await this.cartRepository.save(cartItem);
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

  async findOne(id: string): Promise<Cart> {
    const cart = await this.cartRepository.findOne({
      where: { id },
      relations: ['customer', 'product'],
    });

    if (!cart) {
      throw new NotFoundException(`Cart item with ID ${id} not found`);
    }

    return cart;
  }

  async findByCustomer(customerId: string): Promise<Cart[]> {
    // Verify customer exists
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    return this.cartRepository.find({
      where: { customerId },
      relations: ['product'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateQuantity(
    id: string,
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
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const cartItem = await this.cartRepository.findOne({
      where: { id },
    });

    if (!cartItem) {
      throw new NotFoundException(`Cart item with ID ${id} not found`);
    }

    await this.cartRepository.delete(id);
  }

  async clearCart(customerId: string): Promise<void> {
    // Verify customer exists
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    await this.cartRepository.delete({ customerId });
  }

  // Utility methods
  async getCartTotal(
    customerId: string,
  ): Promise<{ total: number; items: number }> {
    const cartItems = await this.cartRepository.find({
      where: { customerId },
      relations: ['product'],
    });

    const total = cartItems.reduce((sum, item) => {
      return sum + item.product.price * item.quantity;
    }, 0);

    const items = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    return { total, items };
  }

  async getCartItemsCount(customerId: string): Promise<number> {
    return this.cartRepository.count({
      where: { customerId },
    });
  }

  async findCartItemByProductAndCustomer(
    customerId: string,
    productId: string,
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
    updates: { id: string; quantity: number }[],
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
    customerId: string,
    fromCustomerId: string,
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
