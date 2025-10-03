import { BaseEntity } from 'src/shared/entity/base.entity';
import { Order } from 'src/modules/order-management/order/entity/order.entity';
import { Column, Entity, ManyToOne, JoinColumn, Index } from 'typeorm';

export enum PaymentGateway {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  SSL_COMMERZ = 'ssl_commerz',
  CASH_ON_DELIVERY = 'cash_on_delivery',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  PARTIAL_REFUNDED = 'partial_refunded',
}

export enum PaymentType {
  PAYMENT = 'payment',
  REFUND = 'refund',
  PARTIAL_REFUND = 'partial_refund',
}

@Entity('payment')
@Index(['order'])
@Index(['status'])
@Index(['gateway'])
export class Payment extends BaseEntity {
  @Column()
  orderId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency: string;

  @Column({ type: 'enum', enum: PaymentGateway })
  gateway: PaymentGateway;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ type: 'enum', enum: PaymentType, default: PaymentType.PAYMENT })
  type: PaymentType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  gatewayTransactionId?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  gatewayPaymentId?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  gatewayOrderId?: string;

  @Column({ type: 'json', nullable: true })
  gatewayResponse?: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  failureReason?: string;

  @Column({ type: 'timestamptz', nullable: true })
  paidAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  failedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  refundedAt?: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'varchar', nullable: true })
  parentPaymentId?: string; // For refunds, reference to original payment

  // Relations
  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @ManyToOne(() => Payment, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parentPaymentId' })
  parentPayment?: Payment;
}
