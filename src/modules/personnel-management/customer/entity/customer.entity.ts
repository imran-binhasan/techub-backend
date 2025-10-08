import { BaseEntity } from 'src/shared/entity/base.entity';
import { Column, Entity, OneToMany, OneToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../../user/entity/user.entity';
import { Address } from '../../address/entity/address.entity';

export enum CustomerVerificationStatus {
  UNVERIFIED = 'unverified',
  EMAIL_VERIFIED = 'email_verified',
  PHONE_VERIFIED = 'phone_verified',
  FULLY_VERIFIED = 'fully_verified',
}

@Entity('customer')
@Index(['user_id'], { unique: true })
export class Customer extends BaseEntity {
  @OneToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth?: Date;

  @Column({ name: 'gender', type: 'varchar', length: 20, nullable: true })
  gender?: string;

  // Verification status
  @Column({ 
    name: 'verification_status', 
    type: 'enum', 
    enum: CustomerVerificationStatus, 
    default: CustomerVerificationStatus.UNVERIFIED 
  })
  verificationStatus: CustomerVerificationStatus;

  @Column({ name: 'email_verified', type: 'boolean', default: false })
  emailVerified: boolean;

  @Column({ name: 'email_verified_at', type: 'timestamptz', nullable: true })
  emailVerifiedAt?: Date;

  @Column({ name: 'phone_verified', type: 'boolean', default: false })
  phoneVerified: boolean;

  @Column({ name: 'phone_verified_at', type: 'timestamptz', nullable: true })
  phoneVerifiedAt?: Date;

  @OneToMany(() => Address, (address) => address.customer, {
    cascade: true,
  })
  addresses: Address[];

  // Customer metrics
  @Column({ name: 'total_orders', type: 'integer', default: 0 })
  totalOrders: number;

  @Column({ name: 'total_spent', type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalSpent: number;

  @Column({ name: 'points', type: 'integer', default: 0 })
  points: number;

  @Column({ name: 'preferred_language', type: 'varchar', length: 10, nullable: true })
  preferredLanguage?: string; // 'en', 'bn', 'de'
}