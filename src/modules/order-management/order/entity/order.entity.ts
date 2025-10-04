import { BaseEntity } from 'src/shared/entity/base.entity';
import { Column, Entity, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { OrderItem } from './order-item.entity';
import { Customer } from 'src/modules/personnel-management/customer/entity/customer.entity';
import { Coupon } from 'src/modules/product-management/coupon/entity/coupon.entity';
import { Address } from 'src/modules/personnel-management/address/entity/address.entity';


export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
}

@Entity('order')
export class Order extends BaseEntity {
  @Column({ unique: true })
  orderNumber: string;

  @Column()
  customerId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  shippingAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @Column({ type: 'varchar', length: 50, nullable: true })
  paymentMethod?: string; // stripe, paypal, ssl_commerz

  @Column({ type: 'varchar', length: 255, nullable: true })
  paymentTransactionId?: string;

  @Column({ type: 'timestamptz' })
  orderDate: Date;

  @Column({ type: 'timestamptz', nullable: true })
  confirmedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  shippedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  deliveredAt?: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  trackingNumber?: string;

  @Column({ nullable: true })
  couponId?: string;

  @Column({ nullable: true })
  shippingAddressId?: string;

  @Column({ nullable: true })
  billingAddressId?: string;

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
