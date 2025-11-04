import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { OrderService } from '../service/order.service';
import { CreateOrderDto, UpdateOrderDto, QueryOrderDto, OrderResponse } from '../dto';
import { JwtAuthGuard } from '../../../../core/auth/guard/jwt-auth-guard';
import { AdminOnly, Auth } from '../../../../core/auth/decorator/auth.decorator';
import { 
  OrderStatus, 
  PaymentStatus, 
  PaymentMethod,
  ShippingStatus,
  ReturnStatus,
  OrderSource,
  OrderPriority,
} from '../enum/order.enum';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Create a new order',
    description: 'Create a new order with order items, addresses, and payment details. Order number is auto-generated. Stock is automatically reduced upon order creation.',
  })
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Order created successfully',
    type: OrderResponse,
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad Request - Invalid order data or insufficient stock',
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Customer, Product, or Address not found',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createOrderDto: CreateOrderDto): Promise<{
    message: string;
    data: OrderResponse;
  }> {
    const order = await this.orderService.createOrder(createOrderDto);
    return {
      message: 'Order created successfully',
      data: order,
    };
  }

  @Get()
  @AdminOnly()
  @ApiOperation({ 
    summary: 'Get all orders with filtering and pagination',
    description: 'Retrieve all orders with advanced filtering options. Admin only. Results are cached for 1 hour.',
  })
  @ApiQuery({ 
    name: 'page', 
    required: false, 
    type: Number,
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: Number,
    description: 'Items per page (default: 10, max: 100)',
    example: 10,
  })
  @ApiQuery({ 
    name: 'search', 
    required: false, 
    type: String,
    description: 'Search by order number, customer name, or email',
    example: 'ORD-20240115',
  })
  @ApiQuery({ 
    name: 'customerId', 
    required: false, 
    type: Number,
    description: 'Filter by customer ID',
    example: 1,
  })
  @ApiQuery({ 
    name: 'status', 
    required: false, 
    enum: OrderStatus,
    description: 'Filter by order status',
    example: OrderStatus.PROCESSING,
  })
  @ApiQuery({ 
    name: 'paymentStatus', 
    required: false, 
    enum: PaymentStatus,
    description: 'Filter by payment status',
    example: PaymentStatus.PAID,
  })
  @ApiQuery({ 
    name: 'shippingStatus', 
    required: false, 
    enum: ShippingStatus,
    description: 'Filter by shipping status',
    example: ShippingStatus.SHIPPED,
  })
  @ApiQuery({ 
    name: 'returnStatus', 
    required: false, 
    enum: ReturnStatus,
    description: 'Filter by return status',
  })
  @ApiQuery({ 
    name: 'orderSource', 
    required: false, 
    enum: OrderSource,
    description: 'Filter by order source',
  })
  @ApiQuery({ 
    name: 'priority', 
    required: false, 
    enum: OrderPriority,
    description: 'Filter by order priority',
  })
  @ApiQuery({ 
    name: 'orderDateFrom', 
    required: false, 
    type: Date,
    description: 'Filter orders from this date',
    example: '2024-01-01',
  })
  @ApiQuery({ 
    name: 'orderDateTo', 
    required: false, 
    type: Date,
    description: 'Filter orders until this date',
    example: '2024-12-31',
  })
  @ApiQuery({ 
    name: 'minTotal', 
    required: false, 
    type: Number,
    description: 'Minimum order total amount',
    example: 100,
  })
  @ApiQuery({ 
    name: 'maxTotal', 
    required: false, 
    type: Number,
    description: 'Maximum order total amount',
    example: 1000,
  })
  @ApiQuery({ 
    name: 'sortBy', 
    required: false, 
    type: String,
    description: 'Sort by field (default: createdAt)',
    example: 'createdAt',
  })
  @ApiQuery({ 
    name: 'sortOrder', 
    required: false, 
    enum: ['ASC', 'DESC'],
    description: 'Sort order (default: DESC)',
    example: 'DESC',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Orders retrieved successfully',
    type: OrderResponse,
    isArray: true,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async findAll(@Query() query: QueryOrderDto): Promise<{
    message: string;
    data: OrderResponse[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const result = await this.orderService.findAll(query);
    return {
      message: 'Orders retrieved successfully',
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  }

  @Get('customer/:customerId')
  @ApiOperation({ 
    summary: 'Get orders by customer ID',
    description: 'Retrieve all orders for a specific customer with pagination. Cached for 30 minutes. Admin only.',
  })
  @ApiParam({ 
    name: 'customerId', 
    type: 'number',
    description: 'Customer ID',
    example: 1,
  })
  @ApiQuery({ 
    name: 'page', 
    required: false, 
    type: Number,
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: Number,
    description: 'Items per page (default: 10)',
    example: 10,
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Customer orders retrieved successfully',
    type: OrderResponse,
    isArray: true,
  })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCustomerOrders(
    @Param('customerId') customerId: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<{
    message: string;
    data: OrderResponse[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const result = await this.orderService.getOrdersByCustomerId(customerId, page, limit);
    return {
      message: 'Customer orders retrieved successfully',
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  }

  @Get('my-orders')
  @ApiOperation({ 
    summary: 'Get current customer orders',
    description: 'Retrieve all orders for the authenticated customer with pagination. Cached for 30 minutes.',
  })
  @ApiQuery({ 
    name: 'page', 
    required: false, 
    type: Number,
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: Number,
    description: 'Items per page (default: 10)',
    example: 10,
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Orders retrieved successfully',
    type: OrderResponse,
    isArray: true,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyOrders(
    @Req() req: Request,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<{
    message: string;
    data: OrderResponse[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const customerId = (req as any).user.sub; // Assuming JWT payload has sub field with customer ID
    const result = await this.orderService.getOrdersByCustomerId(customerId, page, limit);
    return {
      message: 'Your orders retrieved successfully',
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get order by ID',
    description: 'Retrieve a single order by its ID. Returns detailed order information including items, addresses, and customer details. Cached for 30 minutes.',
  })
  @ApiParam({ 
    name: 'id', 
    type: 'number',
    description: 'Order ID',
    example: 1,
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Order retrieved successfully',
    type: OrderResponse,
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(@Param('id') id: number): Promise<{
    message: string;
    data: OrderResponse;
  }> {
    const order = await this.orderService.findById(id);
    return {
      message: 'Order retrieved successfully',
      data: order,
    };
  }

  @Patch(':id')
  @AdminOnly()
  @ApiOperation({ 
    summary: 'Update order',
    description: 'Update order details including status, payment, shipping information. Status transitions are validated. Invalidates all related caches. Admin only.',
  })
  @ApiParam({ 
    name: 'id', 
    type: 'number',
    description: 'Order ID',
    example: 1,
  })
  @ApiBody({ type: UpdateOrderDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Order updated successfully',
    type: OrderResponse,
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid status transition or invalid data',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async update(
    @Param('id') id: number,
    @Body() updateOrderDto: UpdateOrderDto,
  ): Promise<{
    message: string;
    data: OrderResponse;
  }> {
    const order = await this.orderService.updateOrder(id, updateOrderDto);
    return {
      message: 'Order updated successfully',
      data: order,
    };
  }

  @Patch(':id/cancel')
  @ApiOperation({ 
    summary: 'Cancel order',
    description: 'Cancel an order. Orders can only be cancelled within 24 hours of creation and if status is PENDING, CONFIRMED, or PROCESSING. Invalidates all related caches.',
  })
  @ApiParam({ 
    name: 'id', 
    type: 'number',
    description: 'Order ID',
    example: 1,
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Order cancelled successfully',
    type: OrderResponse,
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ 
    status: 400, 
    description: 'Cannot cancel order - either outside cancellation window (24h) or invalid status',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async cancel(@Param('id') id: number): Promise<{
    message: string;
    data: OrderResponse;
  }> {
    const order = await this.orderService.cancelOrder(id);
    return {
      message: 'Order cancelled successfully',
      data: order,
    };
  }

  @Patch(':id/payment-status')
  @AdminOnly()
  @ApiOperation({ 
    summary: 'Update payment status',
    description: 'Update the payment status of an order. When status is set to PAID, the order status will automatically be updated to PROCESSING.',
  })
  @ApiParam({ 
    name: 'id', 
    type: 'number',
    description: 'Order ID',
    example: 1,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        paymentStatus: {
          type: 'string',
          enum: Object.values(PaymentStatus),
          description: 'Payment status',
          example: PaymentStatus.PAID,
        },
        paymentMethod: {
          type: 'string',
          enum: Object.values(PaymentMethod),
          description: 'Payment method (optional)',
          example: PaymentMethod.CREDIT_CARD,
        },
        transactionId: {
          type: 'string',
          description: 'Transaction ID from payment gateway (optional)',
          example: 'txn_1234567890',
        },
      },
      required: ['paymentStatus'],
    },
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Payment status updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Payment status updated successfully' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 400, description: 'Invalid payment status transition' })
  async updatePaymentStatus(
    @Param('id') id: number,
    @Body() updateData: {
      paymentStatus: PaymentStatus;
      paymentMethod?: PaymentMethod;
      transactionId?: string;
    },
  ): Promise<{
    message: string;
  }> {
    await this.orderService.updatePaymentStatus(
      id,
      updateData.paymentStatus,
      updateData.paymentMethod,
      updateData.transactionId,
    );
    return {
      message: 'Payment status updated successfully',
    };
  }
}
