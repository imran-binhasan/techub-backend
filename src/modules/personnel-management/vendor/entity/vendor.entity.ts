import { BaseEntity } from 'src/shared/entity/base.entity';
import { Column, Entity, OneToOne, JoinColumn, Index, OneToMany } from 'typeorm';
import { User } from '../../user/entity/user.entity';
import { VendorBankInfo } from './vendor-bank-info.entity';
import { VendorAddress } from './vendor-address.entity';
import { VendorKYC } from './vendor-kyc.entity';
import { Product } from 'src/modules/product-management/product/entity/product.entity';

export enum VendorStatus {
  PENDING_VERIFICATION = 'pending_verification',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  BANNED = 'banned',
}

@Entity('vendors')
export class Vendor extends BaseEntity {
  @Column({ name: 'user_id', type: 'int', unique: true })
  @Index()
  userId: number;

  @OneToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'shop_name', type: 'varchar', length: 255 })
  shopName: string;

  @Column({ name: 'shop_slug', type: 'varchar', length: 255, unique: true })
  @Index()
  shopSlug: string;

  @Column({ name: 'shop_description', type: 'text', nullable: true })
  shopDescription?: string;

  @Column({ name: 'shop_logo', type: 'varchar', length: 500, nullable: true })
  shopLogo?: string;

  @Column({ name: 'shop_banner', type: 'varchar', length: 500, nullable: true })
  shopBanner?: string;

  @Column({ 
    name: 'status', 
    type: 'enum', 
    enum: VendorStatus, 
    default: VendorStatus.PENDING_VERIFICATION 
  })
  @Index()
  status: VendorStatus;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  @Index()
  approvedAt?: Date;

  @Column({ name: 'approved_by', type: 'int', nullable: true })
  approvedBy?: number; // Admin ID

  @Column({ name: 'rejected_at', type: 'timestamptz', nullable: true })
  rejectedAt?: Date;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason?: string;


  @Column({ 
    name: 'commission_rate', 
    type: 'decimal', 
    precision: 5, 
    scale: 2,
    default: 15.00 // Platform default
  })
  commissionRate: number;

  @Column({ name: 'commission_type', type: 'enum', enum: ['percentage', 'flat'], default: 'percentage' })
  commissionType: string;

  @Column({ name: 'business_email', type: 'varchar', length: 255, nullable: true })
  businessEmail?: string;

  @Column({ name: 'business_phone', type: 'varchar', length: 20, nullable: true })
  businessPhone?: string;

  @Column({ name: 'total_sales', type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalSales: number;

  @Column({ name: 'total_orders', type: 'integer', default: 0 })
  totalOrders: number;

  @Column({ name: 'completed_orders', type: 'integer', default: 0 })
  completedOrders: number;

  @Column({ name: 'cancelled_orders', type: 'integer', default: 0 })
  cancelledOrders: number;

  @Column({ name: 'average_rating', type: 'decimal', precision: 3, scale: 2, nullable: true })
  averageRating?: number;

  @Column({ name: 'total_reviews', type: 'integer', default: 0 })
  totalReviews: number;

  @Column({ name: 'pending_payout', type: 'decimal', precision: 12, scale: 2, default: 0 })
  pendingPayout: number;

  @Column({ name: 'total_payout', type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalPayout: number;

  @Column({ name: 'last_payout_at', type: 'timestamptz', nullable: true })
  lastPayoutAt?: Date;

  @Column({ name: 'return_days', type: 'integer', default: 7 })
  returnDays: number;

  @Column({ name: 'accepts_returns', type: 'boolean', default: true })
  acceptsReturns: boolean;

  @Column({ name: 'return_policy', type: 'text', nullable: true })
  returnPolicy?: string;

  @OneToOne(() => VendorKYC, (kyc) => kyc.vendor)
  kyc?: VendorKYC;

  @OneToOne(() => VendorBankInfo, (bank) => bank.vendor)
  bankInfo?: VendorBankInfo;

  @OneToMany(() => VendorAddress, (address) => address.vendor)
  addresses: VendorAddress[];

  @OneToMany(() => Product, (product) => product.vendor)
  products: Product[];
}