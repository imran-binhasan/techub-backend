import { BaseEntity } from 'src/shared/entity/base.entity';
import { Column, Entity, OneToOne, JoinColumn, Index } from 'typeorm';
import { Vendor } from './vendor.entity';

@Entity('vendor_bank_info')
@Index(['vendor_id'], { unique: true })
export class VendorBankInfo extends BaseEntity {
  @OneToOne(() => Vendor, (vendor) => vendor.bankInfo, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vendor_id' })
  vendor: Vendor;

  @Column({ name: 'account_holder_name', type: 'varchar', length: 255 })
  accountHolderName: string;

  @Column({ name: 'account_number', type: 'varchar', length: 100 })
  accountNumber: string; // Encrypted

  @Column({ name: 'bank_name', type: 'varchar', length: 255 })
  bankName: string;

  @Column({ name: 'bank_branch', type: 'varchar', length: 255, nullable: true })
  bankBranch?: string;

  @Column({ name: 'bank_code', type: 'varchar', length: 50, nullable: true })
  bankCode?: string; // SWIFT/BIC code

  @Column({ name: 'routing_number', type: 'varchar', length: 100, nullable: true })
  routingNumber?: string;

  @Column({ name: 'account_type', type: 'varchar', length: 50, nullable: true })
  accountType?: string; // 'savings', 'checking', 'business'

  @Column({ name: 'currency', type: 'varchar', length: 3, default: 'BDT' })
  currency: string; // ISO 4217 currency code

  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ name: 'verified_at', type: 'timestamptz', nullable: true })
  verifiedAt?: Date;

  @Column({ name: 'verification_method', type: 'varchar', length: 100, nullable: true })
  verificationMethod?: string; // 'micro_deposit', 'instant', 'manual'
}