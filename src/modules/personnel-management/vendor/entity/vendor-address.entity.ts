import { BaseEntity } from 'src/shared/entity/base.entity';
import {
  Column,
  Entity,
  OneToOne,
  JoinColumn,
  Index,
  ManyToOne,
  DeleteDateColumn,
} from 'typeorm';
import { Vendor } from './vendor.entity';

export enum VendorAddressType {
  BUSINESS = 'business',
  WAREHOUSE = 'warehouse',
  PICKUP = 'pickup',
  REGISTERED = 'registered',
}

@Entity('vendor_address')
@Index(['vendor_id'])
export class VendorAddress extends BaseEntity {
  @ManyToOne(() => Vendor, (vendor) => vendor.addresses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'vendor_id' })
  vendor: Vendor;

  @Column({ name: 'type', type: 'enum', enum: VendorAddressType })
  type: VendorAddressType;

  @Column({ name: 'address_line_1', type: 'varchar', length: 255 })
  addressLine1: string;

  @Column({
    name: 'address_line_2',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  addressLine2?: string;

  @Column({ name: 'city', type: 'varchar', length: 100 })
  city: string;

  @Column({ name: 'state', type: 'varchar', length: 100, nullable: true })
  state?: string;

  @Column({ name: 'postal_code', type: 'varchar', length: 20 })
  postalCode: string;

  @Column({ name: 'country', type: 'varchar', length: 100 })
  country: string;

  @Column({ name: 'country_code', type: 'varchar', length: 3, nullable: true })
  countryCode?: string;

  @Column({ name: 'is_primary', type: 'boolean', default: false })
  isPrimary: boolean;
}
