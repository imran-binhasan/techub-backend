import { BaseEntity } from 'src/shared/entity/base.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { OrderItem } from './order-item.entity';
import { Customer } from 'src/modules/personnel-management/customer/entity/customer.entity';
import { Coupon } from 'src/modules/product-management/coupon/entity/coupon.entity';
import { Address } from 'src/modules/personnel-management/address/entity/address.entity';
import {
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  ShippingStatus,
  ShippingMethod,
  ReturnStatus,
  ReturnReason,
  CancellationReason,
  OrderPriority,
  OrderSource,
  OrderType,
  Currency,
} from '../enum/order.enum';

@Entity('order')
@Index(['status', 'createdAt'])
@Index(['customerId', 'status'])
@Index(['paymentStatus'])
@Index(['shippingStatus'])
@Index(['orderDate'])
@Index(['totalAmount'])
@Index(['returnStatus'])
@Index(['orderSource'])
@Index(['status', 'paymentStatus'])
export class Order extends BaseEntity {
  // ========== Core Order Information ==========
  @Column({ unique: true, length: 50 })
  @Index()
  orderNumber: string;

  @Column()
  @Index()
  customerId: number;

  // ========== Pricing & Amounts ==========
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  taxRate: number; // Percentage (e.g., 10.5 for 10.5%)

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  shippingAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  @Index()
  totalAmount: number;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency: Currency;

  @Column({ type: 'varchar', length: 10, default: 'en-US' })
  locale: string;

  // ========== Order Status ==========
  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  @Index()
  status: OrderStatus;

  @Column({ type: 'enum', enum: OrderPriority, default: OrderPriority.NORMAL })
  priority: OrderPriority;

  @Column({ type: 'enum', enum: OrderType, default: OrderType.STANDARD })
  orderType: OrderType;

  @Column({ type: 'enum', enum: OrderSource, default: OrderSource.WEB })
  @Index()
  orderSource: OrderSource;

  // ========== Payment Information ==========
  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  @Index()
  paymentStatus: PaymentStatus;

  @Column({ type: 'enum', enum: PaymentMethod, nullable: true })
  paymentMethod?: PaymentMethod;

  @Column({ type: 'varchar', length: 255, nullable: true })
  paymentTransactionId?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  paymentGateway?: string; // stripe, paypal, ssl_commerz

  // ========== Shipping Information ==========
  @Column({
    type: 'enum',
    enum: ShippingStatus,
    default: ShippingStatus.NOT_SHIPPED,
  })
  @Index()
  shippingStatus: ShippingStatus;

  @Column({
    type: 'enum',
    enum: ShippingMethod,
    default: ShippingMethod.STANDARD,
  })
  shippingMethod: ShippingMethod;

  @Column({ type: 'varchar', length: 100, nullable: true })
  trackingNumber?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  shippingCarrier?: string; // DHL, FedEx, UPS, etc.

  @Column({ type: 'timestamptz', nullable: true })
  estimatedDeliveryDate?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  actualDeliveryDate?: Date;

  // ========== Date Tracking ==========
  @Column({ type: 'timestamptz' })
  @Index()
  orderDate: Date;

  @Column({ type: 'timestamptz', nullable: true })
  confirmedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  packedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  shippedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  deliveredAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  cancelledAt?: Date;

  // ========== Return & Refund Information ==========
  @Column({
    type: 'enum',
    enum: ReturnStatus,
    default: ReturnStatus.NOT_REQUESTED,
  })
  @Index()
  returnStatus: ReturnStatus;

  @Column({ type: 'enum', enum: ReturnReason, nullable: true })
  returnReason?: ReturnReason;

  @Column({ type: 'timestamptz', nullable: true })
  returnRequestedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  returnApprovedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  returnCompletedAt?: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  refundAmount: number;

  @Column({ type: 'timestamptz', nullable: true })
  refundedAt?: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  refundTransactionId?: string;

  // ========== Cancellation Information ==========
  @Column({ type: 'enum', enum: CancellationReason, nullable: true })
  cancellationReason?: CancellationReason;

  @Column({ type: 'text', nullable: true })
  cancellationNotes?: string;

  // ========== Notes & Communication ==========
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'text', nullable: true })
  customerNotes?: string;

  @Column({ type: 'text', nullable: true })
  adminNotes?: string;

  // ========== Analytics & Tracking ==========
  @Column({ type: 'int', default: 0 })
  itemCount: number; // Total number of items in order

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  totalWeight?: number; // In kg

  @Column({ type: 'int', nullable: true })
  processingTimeMinutes?: number; // Time from order to shipped

  @Column({ type: 'int', nullable: true })
  deliveryTimeHours?: number; // Time from shipped to delivered

  // ========== Technical Metadata ==========
  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>; // Flexible data storage

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress?: string; // Customer IP for fraud detection

  @Column({ type: 'varchar', length: 500, nullable: true })
  userAgent?: string; // Browser/device info

  // ========== Foreign Keys ==========
  @Column({ nullable: true })
  couponId?: number;

  @Column({ nullable: true })
  shippingAddressId?: number;

  @Column({ nullable: true })
  billingAddressId?: number;

  // Relations
  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @ManyToOne(() => Coupon, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'couponId' })
  coupon?: Coupon;

  @ManyToOne(() => Address, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'shippingAddressId' })
  shippingAddress?: Address;

  @ManyToOne(() => Address, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'billingAddressId' })
  billingAddress?: Address;

  @OneToMany(() => OrderItem, (orderItem: OrderItem) => orderItem.order, {
    cascade: true,
    eager: true,
  })
  orderItems: OrderItem[];
}
