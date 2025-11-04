import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Order } from '../entity/order.entity';
import { OrderItem } from '../entity/order-item.entity';
import { CreateOrderDto, UpdateOrderDto, QueryOrderDto, OrderResponse } from '../dto';
import { InventoryService } from '../../inventory/service/inventory.service';
import { TransactionType } from '../../inventory/entity/inventory-transaction.entity';
import { ProductService } from 'src/modules/product-management/product/service/product.service';
import { CartService } from 'src/modules/product-management/cart/service/cart.service';
import { AddressService } from 'src/modules/personnel-management/address/service/address.service';
import { CouponService } from 'src/modules/product-management/coupon/service/coupon.service';
import { CacheService } from 'src/core/cache/service/cache.service';
import {
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  ShippingStatus,
  ShippingMethod,
  OrderPriority,
  OrderSource,
  OrderType,
  Currency,
} from '../enum/order.enum';
import {
  ORDER_CACHE_TTL,
  ORDER_CACHE_KEYS,
  ORDER_BUSINESS_RULES,
  ORDER_MESSAGES,
} from '../constants/order.constants';
import {
  generateOrderNumber,
  calculateSubtotal,
  calculateTax,
  calculateShippingCost,
  calculateDiscount,
  calculateTotalAmount,
  isValidOrderStatusTransition,
  canCancelOrder,
  validateMinimumOrderValue,
  validateMaximumOrderValue,
  getEstimatedDeliveryDate,
  calculateProcessingTime,
  calculateDeliveryTime,
} from '../utils/order.util';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    private readonly productService: ProductService,
    private readonly cartService: CartService,
    private readonly couponService: CouponService,
    private readonly addressService: AddressService,
    private readonly inventoryService: InventoryService,
    private readonly eventService: EventEmitter2,
    private readonly dataSource: DataSource,
    private readonly cacheService: CacheService,
  ) {}

  async createOrder(createOrderDto: CreateOrderDto): Promise<OrderResponse> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validate addresses exist - no ownership restriction for flexibility
      const billingAddress = await this.addressService.findOne(createOrderDto.billingAddressId);
      if (!billingAddress) {
        throw new NotFoundException('Billing address not found');
      }

      let shippingAddress = billingAddress; // Default to billing address
      if (createOrderDto.shippingAddressId) {
        shippingAddress = await this.addressService.findOne(createOrderDto.shippingAddressId);
        if (!shippingAddress) {
          throw new NotFoundException('Shipping address not found');
        }
      }

      // Validate and apply coupon if provided
      let coupon: any = null;
      if (createOrderDto.couponId) {
        coupon = await this.couponService.findOne(createOrderDto.couponId);
        if (!coupon || !coupon.isActive) {
          throw new BadRequestException('Invalid or inactive coupon');
        }
      }

      // Process order items and validate inventory
      const orderItems: OrderItem[] = [];
      let subtotal = 0;

      for (const itemDto of createOrderDto.items) {
        const product = await this.productService.findOne(itemDto.productId);
        if (!product) {
          throw new NotFoundException(`Product with ID ${itemDto.productId} not found`);
        }

        // Check inventory
        const inventory = await this.inventoryService.findByProductId(itemDto.productId);
        if (!inventory || inventory.currentStock < itemDto.quantity) {
          throw new BadRequestException(`Insufficient inventory for product: ${product.name}`);
        }

        // Create order item without null values
        const orderItem = this.orderItemRepository.create({
          productId: itemDto.productId,
          productName: product.name,
          productSku: product.name,
          productImage: product.images?.[0]?.url || undefined,
          quantity: itemDto.quantity,
          unitPrice: product.price,
          totalPrice: product.price * itemDto.quantity,
          productAttributes: itemDto.selectedAttributes,
        });

        orderItems.push(orderItem);
        subtotal += orderItem.totalPrice;
      }

      // Calculate totals
      const shippingCost = createOrderDto.shippingCost || 0;
      const taxAmount = createOrderDto.taxAmount || 0;
      const discountAmount = coupon ? this.calculateDiscount(subtotal, coupon) : 0;
      const totalAmount = subtotal + shippingCost + taxAmount - discountAmount;

      // Calculate sequence number for order number generation
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const orderCount = await this.orderRepository.count({
        where: {
          createdAt: Between(today, new Date()),
        },
      });

      // Create order
      const order = this.orderRepository.create({
        orderNumber: generateOrderNumber(orderCount + 1),
        customerId: createOrderDto.customerId,
        billingAddressId: billingAddress.id,
        shippingAddressId: shippingAddress.id,
        couponId: coupon?.id || null,
        subtotal: subtotal,
        shippingAmount: shippingCost,
        taxAmount: taxAmount,
        taxRate: createOrderDto.taxRate || 0,
        discountAmount: discountAmount,
        totalAmount: totalAmount,
        currency: createOrderDto.currency || Currency.USD,
        locale: createOrderDto.locale || 'en-US',
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        paymentMethod: createOrderDto.paymentMethod,
        shippingStatus: ShippingStatus.NOT_SHIPPED,
        shippingMethod: createOrderDto.shippingMethod || ShippingMethod.STANDARD,
        priority: createOrderDto.priority || OrderPriority.NORMAL,
        orderSource: createOrderDto.orderSource || OrderSource.WEB,
        orderType: createOrderDto.orderType || OrderType.STANDARD,
        returnStatus: 'not_requested' as any,
        orderDate: new Date(),
        itemCount: createOrderDto.items.length,
        notes: createOrderDto.notes,
        customerNotes: createOrderDto.customerNotes,
        ipAddress: createOrderDto.ipAddress,
        userAgent: createOrderDto.userAgent,
        metadata: createOrderDto.metadata,
      });

      const savedOrder = await queryRunner.manager.save(order);

      // Save order items
      for (const orderItem of orderItems) {
        orderItem.orderId = savedOrder.id;
      }
      await queryRunner.manager.save(orderItems);

      // Update inventory stock
      for (const itemDto of createOrderDto.items) {
        await this.inventoryService.adjustStock(
          (await this.inventoryService.findByProductId(itemDto.productId)).id,
          {
            type: 'out' as any,
            quantity: itemDto.quantity,
            reason: `Order ${savedOrder.orderNumber}`,
            referenceId: savedOrder.id,
          }
        );
      }

      // Clear customer's cart if specified
      if (createOrderDto.clearCart) {
        await this.cartService.clearCart(createOrderDto.customerId);
      }

      await queryRunner.commitTransaction();

      // Emit order created event
      this.eventService.emit('order.created', {
        orderId: savedOrder.id,
        customerId: createOrderDto.customerId,
        totalAmount: savedOrder.totalAmount,
      });

      // Invalidate order caches
      await this.invalidateOrderCaches(savedOrder.id, savedOrder);

      return this.transformToOrderResponse(savedOrder);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(queryDto: QueryOrderDto): Promise<{
    data: OrderResponse[];
    total: number;
    page: number;
    limit: number;
  }> {
    // Generate cache key based on query parameters
    const cacheKey = `${ORDER_CACHE_KEYS.LIST}:${JSON.stringify(queryDto)}`;
    const cached = await this.cacheService.get<{
      data: OrderResponse[];
      total: number;
      page: number;
      limit: number;
    }>('orders', cacheKey);

    if (cached) {
      this.logger.debug(`Cache HIT for order list with query: ${JSON.stringify(queryDto)}`);
      return cached;
    }

    this.logger.debug(`Cache MISS for order list with query: ${JSON.stringify(queryDto)}`);

    const queryBuilder = this.orderRepository.createQueryBuilder('order')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('customer.user', 'user')
      .leftJoinAndSelect('order.billingAddress', 'billingAddress')
      .leftJoinAndSelect('order.shippingAddress', 'shippingAddress')
      .leftJoinAndSelect('order.coupon', 'coupon')
      .leftJoinAndSelect('order.orderItems', 'orderItems')
      .leftJoinAndSelect('order.payments', 'payments');

    // Apply filters
    if (queryDto.customerId) {
      queryBuilder.andWhere('order.customerId = :customerId', { customerId: queryDto.customerId });
    }

    if (queryDto.status) {
      queryBuilder.andWhere('order.status = :status', { status: queryDto.status });
    }

    if (queryDto.paymentStatus) {
      queryBuilder.andWhere('order.paymentStatus = :paymentStatus', { paymentStatus: queryDto.paymentStatus });
    }

    if (queryDto.paymentMethod) {
      queryBuilder.andWhere('order.paymentMethod = :paymentMethod', { paymentMethod: queryDto.paymentMethod });
    }

    if (queryDto.shippingStatus) {
      queryBuilder.andWhere('order.shippingStatus = :shippingStatus', { shippingStatus: queryDto.shippingStatus });
    }

    if (queryDto.returnStatus) {
      queryBuilder.andWhere('order.returnStatus = :returnStatus', { returnStatus: queryDto.returnStatus });
    }

    if (queryDto.orderSource) {
      queryBuilder.andWhere('order.orderSource = :orderSource', { orderSource: queryDto.orderSource });
    }

    if (queryDto.priority) {
      queryBuilder.andWhere('order.priority = :priority', { priority: queryDto.priority });
    }

    if (queryDto.orderDateFrom) {
      queryBuilder.andWhere('order.createdAt >= :orderDateFrom', { orderDateFrom: queryDto.orderDateFrom });
    }

    if (queryDto.orderDateTo) {
      queryBuilder.andWhere('order.createdAt <= :orderDateTo', { orderDateTo: queryDto.orderDateTo });
    }

    if (queryDto.minTotal) {
      queryBuilder.andWhere('order.totalAmount >= :minTotal', { minTotal: queryDto.minTotal });
    }

    if (queryDto.maxTotal) {
      queryBuilder.andWhere('order.totalAmount <= :maxTotal', { maxTotal: queryDto.maxTotal });
    }

    if (queryDto.search) {
      queryBuilder.andWhere(
        '(order.orderNumber ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)',
        { search: `%${queryDto.search}%` }
      );
    }

    // Apply sorting
    queryBuilder.orderBy(`order.${queryDto.sortBy}`, queryDto.sortOrder);

    // Apply pagination
    const page = queryDto.page || 1;
    const limit = queryDto.limit || 10;
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [orders, total] = await queryBuilder.getManyAndCount();

    const result = {
      data: orders.map(order => this.transformToOrderResponse(order)),
      total,
      page: page,
      limit: limit,
    };

    // Cache the result
    await this.cacheService.set('orders', cacheKey, result, {
      ttl: ORDER_CACHE_TTL.ORDER_LIST, // 3600 seconds (1 hour)
    });

    return result;
  }

  async findById(id: number): Promise<OrderResponse> {
    // Check cache first
    const cacheKey = `${ORDER_CACHE_KEYS.SINGLE}:${id}`;
    const cached = await this.cacheService.get<OrderResponse>('orders', cacheKey);

    if (cached) {
      this.logger.debug(`Cache HIT for order ${id}`);
      return cached;
    }

    this.logger.debug(`Cache MISS for order ${id}`);

    const order = await this.orderRepository.findOne({
      where: { id },
      relations: [
        'customer',
        'customer.user',
        'billingAddress',
        'shippingAddress',
        'coupon',
        'orderItems',
      ],
    });

    if (!order) {
      throw new NotFoundException(ORDER_MESSAGES.ERROR.NOT_FOUND);
    }

    const response = this.transformToOrderResponse(order);

    // Cache the result
    await this.cacheService.set('orders', cacheKey, response, {
      ttl: ORDER_CACHE_TTL.SINGLE_ORDER,
    });

    return response;
  }

  async updateOrder(id: number, updateOrderDto: UpdateOrderDto): Promise<OrderResponse> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['customer', 'items'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Validate status transitions
    if (updateOrderDto.status && !isValidOrderStatusTransition(order.status, updateOrderDto.status)) {
      throw new BadRequestException(
        ORDER_MESSAGES.ERROR.INVALID_STATUS_TRANSITION + `: ${order.status} -> ${updateOrderDto.status}`,
      );
    }

    const oldStatus = order.status;

    // Update order
    Object.assign(order, updateOrderDto);
    const savedOrder = await this.orderRepository.save(order);

    // Invalidate caches
    await this.invalidateOrderCaches(savedOrder.id, savedOrder);

    // Emit status change event if status changed
    if (updateOrderDto.status && updateOrderDto.status !== oldStatus) {
      this.eventService.emit('order.status.changed', {
        orderId: savedOrder.id,
        customerId: savedOrder.customerId,
        oldStatus: oldStatus,
        newStatus: updateOrderDto.status,
      });
    }

    return this.findById(savedOrder.id);
  }

  async cancelOrder(id: number): Promise<OrderResponse> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['orderItems'],
    });

    if (!order) {
      throw new NotFoundException(ORDER_MESSAGES.ERROR.NOT_FOUND);
    }

    // Use utility function to check if order can be cancelled
    const { canCancel, reason } = canCancelOrder(order.status, order.orderDate);
    if (!canCancel) {
      throw new BadRequestException(reason || ORDER_MESSAGES.ERROR.CANNOT_CANCEL);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Update order status
      order.status = OrderStatus.CANCELLED;
      order.paymentStatus = PaymentStatus.FAILED; // Use FAILED instead of CANCELLED
      await queryRunner.manager.save(order);

      // Release inventory by adding stock back
      for (const item of order.orderItems) {
        const inventory = await this.inventoryService.findByProductId(item.productId);
        await this.inventoryService.adjustStock(inventory.id, {
          type: TransactionType.IN,
          quantity: item.quantity,
          reason: `Order cancelled: ${order.orderNumber}`,
          referenceId: order.id,
        });
      }

      await queryRunner.commitTransaction();

      // Invalidate caches
      await this.invalidateOrderCaches(order.id, order);

      // Emit order cancelled event
      this.eventService.emit('order.cancelled', {
        orderId: order.id,
        customerId: order.customerId,
        totalAmount: order.totalAmount,
      });

      this.logger.log(`Order ${order.orderNumber} cancelled successfully`);

      return this.transformToOrderResponse(order);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to cancel order ${id}:`, error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updatePaymentStatus(
    orderId: number,
    paymentStatus: PaymentStatus,
    paymentMethod?: PaymentMethod,
    transactionId?: string,
  ): Promise<void> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['customer', 'orderItems'],
    });

    if (!order) {
      throw new NotFoundException(ORDER_MESSAGES.ERROR.NOT_FOUND);
    }

    order.paymentStatus = paymentStatus;
    if (paymentMethod) order.paymentMethod = paymentMethod;
    if (transactionId) order.paymentTransactionId = transactionId;

    // If payment is successful, update order status
    if (paymentStatus === PaymentStatus.PAID) {
      order.status = OrderStatus.PROCESSING;
      order.confirmedAt = new Date();
      
      // Inventory stock was already reduced during order creation
      // No additional inventory operations needed here
    }

    const updatedOrder = await this.orderRepository.save(order);

    // Invalidate all related caches
    await this.invalidateOrderCaches(updatedOrder.id, updatedOrder);

    // Emit payment status change event
    this.eventService.emit('order.payment.status.changed', {
      orderId: updatedOrder.id,
      customerId: updatedOrder.customerId,
      paymentStatus: paymentStatus,
      paymentMethod: paymentMethod,
      transactionId: transactionId,
    });

    this.logger.log(`Payment status updated for order ${updatedOrder.id} to ${paymentStatus}`);
  }

  async getOrdersByCustomerId(customerId: number, page: number = 1, limit: number = 10): Promise<{
    data: OrderResponse[];
    total: number;
    page: number;
    limit: number;
  }> {
    // Generate cache key with customer ID and pagination
    const cacheKey = `${ORDER_CACHE_KEYS.CUSTOMER_ORDERS}:${customerId}:p${page}:l${limit}`;
    const cached = await this.cacheService.get<{
      data: OrderResponse[];
      total: number;
      page: number;
      limit: number;
    }>('orders', cacheKey);

    if (cached) {
      this.logger.debug(`Cache HIT for customer ${customerId} orders (page ${page})`);
      return cached;
    }

    this.logger.debug(`Cache MISS for customer ${customerId} orders (page ${page})`);

    const [orders, total] = await this.orderRepository.findAndCount({
      where: { customer: { id: customerId } },
      relations: [
        'customer',
        'customer.user',
        'billingAddress',
        'shippingAddress',
        'coupon',
        'orderItems',
        'payments',
      ],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const result = {
      data: orders.map(order => this.transformToOrderResponse(order)),
      total,
      page,
      limit,
    };

    // Cache the result
    await this.cacheService.set('orders', cacheKey, result, {
      ttl: ORDER_CACHE_TTL.CUSTOMER_ORDERS, // 1800 seconds (30 minutes)
    });

    return result;
  }

  private async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const dateStr = date.getFullYear().toString() + 
                   (date.getMonth() + 1).toString().padStart(2, '0') + 
                   date.getDate().toString().padStart(2, '0');
    
    const count = await this.orderRepository.count({
      where: {
        createdAt: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
      },
    });

    return `ORD-${dateStr}-${(count + 1).toString().padStart(4, '0')}`;
  }

  private calculateDiscount(subtotal: number, coupon: any): number {
    if (coupon.couponType === 'percentage') {
      const discount = (subtotal * coupon.discountPercentage) / 100;
      return Math.min(discount, coupon.maxDiscountAmount || Infinity);
    } else if (coupon.couponType === 'fixed') {
      return Math.min(coupon.discountAmount, subtotal);
    }
    return 0;
  }

  // Removed - now using utility function isValidOrderStatusTransition from utils

  private transformToOrderResponse(order: Order): OrderResponse {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      customer: order.customer?.user ? {
        id: order.customer.id,
        firstName: order.customer.user.firstName,
        lastName: order.customer.user.lastName,
        email: order.customer.user.email || '',
      } : undefined,
      subtotal: order.subtotal,
      taxAmount: order.taxAmount,
      shippingAmount: order.shippingAmount,
      discountAmount: order.discountAmount,
      totalAmount: order.totalAmount,
      currency: order.currency,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      paymentTransactionId: order.paymentTransactionId,
      shippingStatus: order.shippingStatus,
      shippingMethod: order.shippingMethod,
      trackingNumber: order.trackingNumber,
      shippingCarrier: order.shippingCarrier,
      returnStatus: order.returnStatus,
      priority: order.priority,
      orderSource: order.orderSource,
      orderType: order.orderType,
      orderDate: order.orderDate,
      confirmedAt: order.confirmedAt,
      packedAt: order.packedAt,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
      cancelledAt: order.cancelledAt,
      estimatedDeliveryDate: order.estimatedDeliveryDate,
      notes: order.notes,
      customerNotes: order.customerNotes,
      adminNotes: order.adminNotes,
      coupon: order.coupon,
      shippingAddress: order.shippingAddress,
      billingAddress: order.billingAddress,
      orderItems: order.orderItems?.map(item => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        productSku: item.productSku,
        productImage: item.productImage,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        productAttributes: item.productAttributes,
      })) || [],
      itemCount: order.itemCount,
      processingTimeMinutes: order.processingTimeMinutes,
      deliveryTimeHours: order.deliveryTimeHours,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  /**
   * Invalidate order caches
   */
  private async invalidateOrderCaches(orderId: number, order: Order): Promise<void> {
    try {
      // Invalidate single order cache
      await this.cacheService.del('orders', `${ORDER_CACHE_KEYS.SINGLE}:${orderId}`);

      // Invalidate customer orders
      await this.cacheService.deleteByPattern(
        'orders',
        `${ORDER_CACHE_KEYS.CUSTOMER_ORDERS}:${order.customerId}:*`,
      );

      // Invalidate order lists
      await this.cacheService.deleteByPattern('orders', `${ORDER_CACHE_KEYS.LIST}:*`);

      // Invalidate pending orders
      await this.cacheService.deleteByPattern('orders', `${ORDER_CACHE_KEYS.PENDING}:*`);

      // Invalidate stats and analytics
      await this.cacheService.deleteByPattern('orders', `${ORDER_CACHE_KEYS.STATS}:*`);
      await this.cacheService.deleteByPattern('orders', `${ORDER_CACHE_KEYS.ANALYTICS}:*`);

      this.logger.debug(`Invalidated caches for order ${orderId}`);
    } catch (error) {
      this.logger.error(`Failed to invalidate caches for order ${orderId}:`, error);
      // Don't throw - cache failures shouldn't break order operations
    }
  }
}
