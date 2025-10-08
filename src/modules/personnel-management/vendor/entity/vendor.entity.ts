import { BaseEntity } from 'src/shared/entity/base.entity';
import { Column, Entity, OneToOne, JoinColumn, Index, OneToMany } from 'typeorm';
import { User } from '../../user/entity/user.entity';
import { VendorBankInfo } from './vendor-bank-info.entity';
import { VendorAddress } from './vendor-address.entity';
import { VendorKYC } from './vendor-kyc.entity';

export enum VendorStatus {
  PENDING_VERIFICATION = 'pending_verification',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  BANNED = 'banned',
}

@Entity('vendor')
@Index(['user_id'], { unique: true })
export class Vendor extends BaseEntity {
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

  @Column({ name: 'status', type: 'enum', enum: VendorStatus, default: VendorStatus.PENDING_VERIFICATION })
  status: VendorStatus;

  @Column({ name: 'commission_rate', type: 'decimal', precision: 5, scale: 2, default: 0 })
  commissionRate: number;

  // Business contact (non-sensitive)
  @Column({ name: 'business_email', type: 'varchar', length: 255, nullable: true })
  businessEmail?: string;

  @Column({ name: 'business_phone', type: 'varchar', length: 20, nullable: true })
  businessPhone?: string;

  // Metrics
  @Column({ name: 'total_sales', type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalSales: number;

  @Column({ name: 'total_orders', type: 'integer', default: 0 })
  totalOrders: number;

  @Column({ name: 'average_rating', type: 'decimal', precision: 3, scale: 2, nullable: true })
  averageRating?: number;

  @Column({ name: 'total_reviews', type: 'integer', default: 0 })
  totalReviews: number;

  @OneToOne(() => VendorKYC, (kyc) => kyc.vendor)
  kyc?: VendorKYC;

  @OneToOne(() => VendorBankInfo, (bank) => bank.vendor)
  bankInfo?: VendorBankInfo;

  @OneToMany(() => VendorAddress, (address) => address.vendor)
  addresses: VendorAddress[];
}