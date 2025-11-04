import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Payment, PaymentGateway, PaymentStatus, PaymentType } from '../entity/payment.entity';
import { OrderService } from '../../order/service/order.service';
import { Order } from '../../order/entity/order.entity';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly orderService: OrderService,
    private readonly eventService: EventEmitter2,
  ) {}

  async createPayment(
    orderId: number,
    gateway: PaymentGateway,
    amount: number,
    gatewayTransactionId: string,
    gatewayResponse?: any,
  ): Promise<Payment> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const payment = this.paymentRepository.create({
      orderId: orderId,
      gateway: gateway,
      amount: amount,
      currency: 'USD', // Default currency, can be made configurable
      status: PaymentStatus.PENDING,
      gatewayTransactionId: gatewayTransactionId,
      gatewayResponse: gatewayResponse,
    });

    const savedPayment = await this.paymentRepository.save(payment);

    // Emit payment created event
    this.eventService.emit('payment.created', {
      paymentId: savedPayment.id,
      orderId: orderId,
      amount: amount,
      gateway: gateway,
    });

    return savedPayment;
  }

  async updatePaymentStatus(
    paymentId: number,
    status: PaymentStatus,
    gatewayResponse?: any,
  ): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
      relations: ['order'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const oldStatus = payment.status;
    payment.status = status;

    // Set appropriate timestamp based on status
    if (status === PaymentStatus.COMPLETED) {
      payment.paidAt = new Date();
    } else if (status === PaymentStatus.FAILED) {
      payment.failedAt = new Date();
    } else if (status === PaymentStatus.REFUNDED) {
      payment.refundedAt = new Date();
    }

    if (gatewayResponse) {
      payment.gatewayResponse = gatewayResponse;
    }

    const updatedPayment = await this.paymentRepository.save(payment);

    // Update order payment status
    await this.orderService.updatePaymentStatus(
      payment.orderId,
      status as any,
      payment.gateway as any,
      payment.gatewayTransactionId,
    );

    // Emit payment status change event
    this.eventService.emit('payment.status.changed', {
      paymentId: updatedPayment.id,
      orderId: payment.orderId,
      oldStatus: oldStatus,
      newStatus: status,
      gateway: payment.gateway,
    });

    return updatedPayment;
  }

  async findByOrderId(orderId: number): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { orderId: orderId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByGatewayTransactionId(
    gateway: PaymentGateway,
    transactionId: string,
  ): Promise<Payment | null> {
    return this.paymentRepository.findOne({
      where: {
        gateway: gateway,
        gatewayTransactionId: transactionId,
      },
      relations: ['order'],
    });
  }

  async createRefund(
    originalPaymentId: number,
    refundAmount: number,
    reason?: string,
    gatewayRefundId?: string,
  ): Promise<Payment> {
    const originalPayment = await this.paymentRepository.findOne({
      where: { id: originalPaymentId },
      relations: ['order'],
    });

    if (!originalPayment) {
      throw new NotFoundException('Original payment not found');
    }

    if (originalPayment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException('Can only refund completed payments');
    }

    if (refundAmount > originalPayment.amount) {
      throw new BadRequestException('Refund amount cannot exceed original payment amount');
    }

    // Check existing refunds
    const existingRefunds = await this.paymentRepository.find({
      where: { 
        parentPaymentId: originalPaymentId.toString(),
        status: PaymentStatus.COMPLETED,
      },
    });

    const totalRefunded = existingRefunds.reduce((sum, refund) => sum + refund.amount, 0);
    if (totalRefunded + refundAmount > originalPayment.amount) {
      throw new BadRequestException('Total refund amount exceeds original payment');
    }

    const refundPayment = this.paymentRepository.create({
      order: originalPayment.order,
      gateway: originalPayment.gateway,
      amount: refundAmount,
      currency: originalPayment.currency,
      status: PaymentStatus.PENDING,
      type: PaymentType.REFUND,
      parentPaymentId: originalPaymentId.toString(),
      gatewayTransactionId: gatewayRefundId || `refund_${Date.now()}`,
      failureReason: reason,
    } as any);

    const savedRefund = await this.paymentRepository.save(refundPayment);

    // Emit refund created event
    this.eventService.emit('payment.refund.created', {
      refundId: savedRefund.id,
      originalPaymentId: originalPaymentId,
      orderId: originalPayment.orderId,
      refundAmount: refundAmount,
      reason: reason,
    });

    return savedRefund;
  }

  async getPaymentsByDateRange(
    startDate: Date,
    endDate: Date,
    gateway?: PaymentGateway,
  ): Promise<Payment[]> {
    const queryBuilder = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.order', 'order')
      .where('payment.createdAt >= :startDate', { startDate })
      .andWhere('payment.createdAt <= :endDate', { endDate });

    if (gateway) {
      queryBuilder.andWhere('payment.gateway = :gateway', { gateway });
    }

    return queryBuilder
      .orderBy('payment.createdAt', 'DESC')
      .getMany();
  }

  async getPaymentStats(gateway?: PaymentGateway): Promise<{
    totalPayments: number;
    totalAmount: number;
    successfulPayments: number;
    failedPayments: number;
    refundedAmount: number;
  }> {
    const queryBuilder = this.paymentRepository.createQueryBuilder('payment');

    if (gateway) {
      queryBuilder.where('payment.gateway = :gateway', { gateway });
    }

    const [
      totalPayments,
      successfulPayments,
      failedPayments,
      totalAmountResult,
      refundedAmountResult,
    ] = await Promise.all([
      queryBuilder.getCount(),
      queryBuilder.clone().andWhere('payment.status = :status', { status: PaymentStatus.COMPLETED }).getCount(),
      queryBuilder.clone().andWhere('payment.status = :status', { status: PaymentStatus.FAILED }).getCount(),
      queryBuilder.clone().andWhere('payment.status = :status', { status: PaymentStatus.COMPLETED }).select('SUM(payment.amount)', 'total').getRawOne(),
      queryBuilder.clone().andWhere('payment.type = :type', { type: 'refund' }).andWhere('payment.status = :status', { status: PaymentStatus.COMPLETED }).select('SUM(payment.amount)', 'total').getRawOne(),
    ]);

    return {
      totalPayments,
      totalAmount: parseFloat(totalAmountResult?.total || '0'),
      successfulPayments,
      failedPayments,
      refundedAmount: parseFloat(refundedAmountResult?.total || '0'),
    };
  }
}
