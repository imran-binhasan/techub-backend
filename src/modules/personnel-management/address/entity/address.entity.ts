import { BaseEntity } from 'src/shared/entity/base.entity';
import { Column, DeleteDateColumn, Entity, ManyToOne, Index } from 'typeorm';
import { Customer } from '../../customer/entity/customer.entity';

export enum AddressType {
  SHIPPING = 'shipping',
  BILLING = 'billing',
  BOTH = 'both',
}

@Entity('address')
export class Address extends BaseEntity {
  @Column({ name: 'full_name', type: 'varchar', length: 200 })
  fullName: string;

  @Column({ name: 'phone', type: 'varchar', length: 20 })
  phone: string;

  @Column({ name: 'address_line_1', type: 'varchar', length: 255 })
  addressLine1: string;

  @Column({ name: 'address_line_2', type: 'varchar', length: 255, nullable: true })
  addressLine2?: string;

  @Column({ name: 'city', type: 'varchar', length: 100 })
  city: string;

  @Column({ name: 'state', type: 'varchar', length: 100, nullable: true })
  state?: string;

  @Column({ name: 'postal_code', type: 'varchar', length: 20 })
  postalCode: string;

  @Column({ name: 'country', type: 'varchar', length: 100 })
  country: string; // Free text for multi-country support

  @Column({ name: 'country_code', type: 'varchar', length: 3, nullable: true })
  countryCode?: string; // ISO 3166-1 alpha-2 (e.g., 'BD', 'US', 'DE')

  @Column({ name: 'type', type: 'enum', enum: AddressType, default: AddressType.SHIPPING })
  type: AddressType;

  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault: boolean;

  @ManyToOne(() => Customer, (customer) => customer.addresses, {
    onDelete: 'CASCADE',
  })
  customer: Customer;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt?: Date;
}