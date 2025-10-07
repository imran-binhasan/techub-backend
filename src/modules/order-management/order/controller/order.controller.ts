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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import type { Request } from 'express';
import { OrderService } from '../service/order.service';
import { CreateOrderDto, UpdateOrderDto, QueryOrderDto, OrderResponse } from '../dto';
import { JwtAuthGuard } from '../../../../core/auth/guard/jwt-auth-guard';
import { AdminOnly, Auth } from '../../../../core/auth/decorator/auth.decorator';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Customer, Product, or Address not found' })
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
  @ApiOperation({ summary: 'Get all orders with filtering and pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'customerId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'partial_refunded'] })
  @ApiQuery({ name: 'paymentStatus', required: false, enum: ['pending', 'paid', 'failed', 'refunded', 'partial_refunded'] })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
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
  @ApiOperation({ summary: 'Get orders by customer ID' })
  @ApiResponse({ status: 200, description: 'Customer orders retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
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
  @ApiOperation({ summary: 'Get current customer orders' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
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
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
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
  @ApiOperation({ summary: 'Update order' })
  @ApiResponse({ status: 200, description: 'Order updated successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
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
  @ApiOperation({ summary: 'Cancel order' })
  @ApiResponse({ status: 200, description: 'Order cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 400, description: 'Cannot cancel order in current status' })
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
  @ApiOperation({ summary: 'Update payment status' })
  @ApiResponse({ status: 200, description: 'Payment status updated successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async updatePaymentStatus(
    @Param('id') id: number,
    @Body() updateData: {
      paymentStatus: string;
      paymentMethod?: string;
      transactionId?: string;
    },
  ): Promise<{
    message: string;
  }> {
    await this.orderService.updatePaymentStatus(
      id,
      updateData.paymentStatus as any,
      updateData.paymentMethod,
      updateData.transactionId,
    );
    return {
      message: 'Payment status updated successfully',
    };
  }
}
