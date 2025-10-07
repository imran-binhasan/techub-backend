import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Order, OrderStatus, PaymentStatus } from '../entity/order.entity';
import { OrderItem } from '../entity/order-item.entity';
import { CreateOrderDto, UpdateOrderDto, QueryOrderDto, OrderResponse } from '../dto';
import { CustomerService } from '../../../../../user-management/customer/service/customer.service';
import { ProductService } from '../../../../../product-management/product/service/product.service';
import { CartService } from '../../../../../product-management/cart/service/cart.service';
import { CouponService } from '../../../../../product-management/coupon/service/coupon.service';
import { AddressService } from '../../../../../user-management/address/service/address.service';
import { InventoryService } from '../../inventory/service/inventory.service';
import { TransactionType } from '../../inventory/entity/inventory-transaction.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    private readonly customerService: CustomerService,
    private readonly productService: ProductService,
    private readonly cartService: CartService,
    private readonly couponService: CouponService,
    private readonly addressService: AddressService,
    private readonly inventoryService: InventoryService,
    private readonly eventService: EventEmitter2,
    private readonly dataSource: DataSource,
  ) {}

  async createOrder(createOrderDto: CreateOrderDto): Promise<OrderResponse> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validate customer
      const customer = await this.customerService.findOne(createOrderDto.customerId);

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

      // Create order
      const order = this.orderRepository.create({
        orderNumber: await this.generateOrderNumber(),
        customerId: customer.id,
        billingAddressId: billingAddress.id,
        shippingAddressId: shippingAddress.id,
        couponId: coupon?.id || null,
        subtotal: subtotal,
        shippingAmount: shippingCost,
        taxAmount: taxAmount,
        discountAmount: discountAmount,
        totalAmount: totalAmount,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        orderDate: new Date(),
        notes: createOrderDto.notes,
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
        await this.cartService.clearCart(customer.id);
      }

      await queryRunner.commitTransaction();

      // Emit order created event
      this.eventService.emit('order.created', {
        orderId: savedOrder.id,
        customerId: customer.id,
        totalAmount: savedOrder.totalAmount,
      });

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
    const queryBuilder = this.orderRepository.createQueryBuilder('order')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('order.billingAddress', 'billingAddress')
      .leftJoinAndSelect('order.shippingAddress', 'shippingAddress')
      .leftJoinAndSelect('order.coupon', 'coupon')
      .leftJoinAndSelect('order.items', 'items')
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
        '(order.orderNumber ILIKE :search OR customer.firstName ILIKE :search OR customer.lastName ILIKE :search OR customer.email ILIKE :search)',
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

    return {
      data: orders.map(order => this.transformToOrderResponse(order)),
      total,
      page: page,
      limit: limit,
    };
  }

  async findById(id: number): Promise<OrderResponse> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: [
        'customer',
        'billingAddress',
        'shippingAddress',
        'coupon',
        'items',
        'payments',
      ],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.transformToOrderResponse(order);
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
    if (updateOrderDto.status && !this.isValidStatusTransition(order.status, updateOrderDto.status)) {
      throw new BadRequestException(`Invalid status transition from ${order.status} to ${updateOrderDto.status}`);
    }

    // Update order
    Object.assign(order, updateOrderDto);
    const savedOrder = await this.orderRepository.save(order);

    // Emit status change event if status changed
    if (updateOrderDto.status && updateOrderDto.status !== order.status) {
      this.eventService.emit('order.status.changed', {
        orderId: savedOrder.id,
        customerId: savedOrder.customer.id,
        oldStatus: order.status,
        newStatus: updateOrderDto.status,
      });
    }

    return this.findById(savedOrder.id);
  }

  async cancelOrder(id: number): Promise<OrderResponse> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['customer', 'items'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Cannot cancel order in current status');
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

      // Emit order cancelled event
      this.eventService.emit('order.cancelled', {
        orderId: order.id,
        customerId: order.customer.id,
        totalAmount: order.totalAmount,
      });

      return this.transformToOrderResponse(order);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updatePaymentStatus(orderId: string, paymentStatus: PaymentStatus, paymentMethod?: string, transactionId?: string): Promise<void> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['customer', 'items'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
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
      }    await this.orderRepository.save(order);

    // Emit payment status change event
    this.eventService.emit('order.payment.status.changed', {
      orderId: order.id,
      customerId: order.customer.id,
      paymentStatus: paymentStatus,
      paymentMethod: paymentMethod,
      transactionId: transactionId,
    });
  }

  async getOrdersByCustomerId(customerId: number, page: number = 1, limit: number = 10): Promise<{
    data: OrderResponse[];
    total: number;
    page: number;
    limit: number;
  }> {
    const [orders, total] = await this.orderRepository.findAndCount({
      where: { customer: { id: customerId } },
      relations: [
        'customer',
        'billingAddress',
        'shippingAddress',
        'coupon',
        'items',
        'payments',
      ],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: orders.map(order => this.transformToOrderResponse(order)),
      total,
      page,
      limit,
    };
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

  private isValidStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  private transformToOrderResponse(order: Order): OrderResponse {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      customer: order.customer ? {
        id: order.customer.id,
        firstName: order.customer.firstName,
        lastName: order.customer.lastName,
        email: order.customer.email,
      } : null,
      billingAddress: order.billingAddress,
      shippingAddress: order.shippingAddress,
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
      coupon: order.coupon ? {
        id: order.coupon.id,
        code: order.coupon.code,
        couponType: order.coupon.couponType,
        discountPercentage: order.coupon.discountPercentage,
        discountAmount: order.coupon.discountAmount,
      } : null,
      subtotal: order.subtotal,
      shippingAmount: order.shippingAmount,
      taxAmount: order.taxAmount,
      discountAmount: order.discountAmount,
      totalAmount: order.totalAmount,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      paymentTransactionId: order.paymentTransactionId,
      orderDate: order.orderDate,
      confirmedAt: order.confirmedAt,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
      trackingNumber: order.trackingNumber,
      notes: order.notes,
    };
  }
}
