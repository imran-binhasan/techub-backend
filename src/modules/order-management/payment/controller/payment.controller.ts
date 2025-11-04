import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PaymentService } from '../service/payment.service';
import { Payment, PaymentGateway, PaymentStatus } from '../entity/payment.entity';
import { AdminOnly, Auth } from 'src/core/auth/decorator/auth.decorator';

@ApiTags('Payments')
@Controller('payments')
@Auth()
@ApiBearerAuth()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post(':orderId')
  @ApiOperation({ summary: 'Create a payment for an order' })
  @ApiResponse({ status: 201, description: 'Payment created successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @HttpCode(HttpStatus.CREATED)
  async createPayment(
    @Param('orderId') orderId: number,
    @Body() createPaymentDto: {
      gateway: PaymentGateway;
      amount: number;
      gatewayTransactionId: string;
      gatewayResponse?: any;
    },
  ): Promise<{
    message: string;
    data: Payment;
  }> {
    const payment = await this.paymentService.createPayment(
      orderId,
      createPaymentDto.gateway,
      createPaymentDto.amount,
      createPaymentDto.gatewayTransactionId,
      createPaymentDto.gatewayResponse,
    );
    return {
      message: 'Payment created successfully',
      data: payment,
    };
  }

  @Patch(':id/status')
  @AdminOnly()
  @ApiOperation({ summary: 'Update payment status' })
  @ApiResponse({ status: 200, description: 'Payment status updated successfully' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async updatePaymentStatus(
    @Param('id') id: number,
    @Body() updateData: {
      status: PaymentStatus;
      gatewayResponse?: any;
    },
  ): Promise<{
    message: string;
    data: Payment;
  }> {
    const payment = await this.paymentService.updatePaymentStatus(
      id,
      updateData.status,
      updateData.gatewayResponse,
    );
    return {
      message: 'Payment status updated successfully',
      data: payment,
    };
  }

  @Get('order/:orderId')
  @ApiOperation({ summary: 'Get payments by order ID' })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully' })
  async getPaymentsByOrder(@Param('orderId') orderId: number): Promise<{
    message: string;
    data: Payment[];
  }> {
    const payments = await this.paymentService.findByOrderId(orderId);
    return {
      message: 'Payments retrieved successfully',
      data: payments,
    };
  }

  @Post(':paymentId/refund')
  @AdminOnly()
  @ApiOperation({ summary: 'Create a refund for a payment' })
  @ApiResponse({ status: 201, description: 'Refund created successfully' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiResponse({ status: 400, description: 'Cannot refund this payment' })
  @HttpCode(HttpStatus.CREATED)
  async createRefund(
    @Param('paymentId') paymentId: string,
    @Body() refundData: {
      amount: number;
      reason?: string;
      gatewayRefundId?: string;
    },
  ): Promise<{
    message: string;
    data: Payment;
  }> {
    const refund = await this.paymentService.createRefund(
      parseInt(paymentId),
      refundData.amount,
      refundData.reason,
      refundData.gatewayRefundId,
    );
    return {
      message: 'Refund created successfully',
      data: refund,
    };
  }

  @Get('stats')
  @AdminOnly()
  @ApiOperation({ summary: 'Get payment statistics' })
  @ApiQuery({ name: 'gateway', required: false, enum: PaymentGateway })
  @ApiResponse({ status: 200, description: 'Payment statistics retrieved successfully' })
  async getPaymentStats(@Query('gateway') gateway?: PaymentGateway): Promise<{
    message: string;
    data: {
      totalPayments: number;
      totalAmount: number;
      successfulPayments: number;
      failedPayments: number;
      refundedAmount: number;
    };
  }> {
    const stats = await this.paymentService.getPaymentStats(gateway);
    return {
      message: 'Payment statistics retrieved successfully',
      data: stats,
    };
  }

  @Get('date-range')
  @AdminOnly()
  @ApiOperation({ summary: 'Get payments by date range' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiQuery({ name: 'gateway', required: false, enum: PaymentGateway })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully' })
  async getPaymentsByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('gateway') gateway?: PaymentGateway,
  ): Promise<{
    message: string;
    data: Payment[];
  }> {
    const payments = await this.paymentService.getPaymentsByDateRange(
      new Date(startDate),
      new Date(endDate),
      gateway,
    );
    return {
      message: 'Payments retrieved successfully',
      data: payments,
    };
  }
}
