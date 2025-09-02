import { Base } from 'src/common/entity/base.entity';
import { Customer } from 'src/customer/entity/customer.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

export enum CountryList {
  BANGLADESH = 'bangladesh',
  GERMANY = 'germany',
  USA = 'united_states',
  CANADA = 'canada',
}

export enum AddressType {
  SHIPPING = 'shipping',
  BILLING = 'billing',
}

@Entity('address')
export class Address extends Base {
  @Column()
  street: string;

  @Column()
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  postalCode: string;

  @Column({ nullable: true })
  addressLine: string;

  @Column({ type: 'enum', enum: AddressType, default: AddressType.SHIPPING })
  type: AddressType;

  @Column({ type: 'enum', enum: CountryList, default: CountryList.BANGLADESH })
  country: CountryList;

  @Column({ default: false })
  isDefault: boolean;

  @ManyToOne(() => Customer, (customer) => customer.addresses, {
    onDelete: 'CASCADE',
  })
  customer: Customer;
}
