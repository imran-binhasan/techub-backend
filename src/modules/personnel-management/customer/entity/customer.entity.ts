import { BaseEntity } from 'src/shared/entity/base.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { CustomerNotification } from 'src/modules/notification-management/notification/entity/customer-notification';
import { Address } from '../../address/entity/address.entity';
import { Cart } from 'src/modules/product-management/cart/entity/cart.entity';
import { Wishlist } from 'src/modules/product-management/wishlist/entity/wishlist.entity';

@Entity('customer')
export class Customer extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @Column({ type: 'varchar', length: 100 })
  lastName: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'text', select: false })
  password: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image?: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => Address, (address) => address.customer, {
    onDelete: 'CASCADE',
  })
  addresses: Address[];

  @OneToMany(() => Cart, (cart) => cart.customer, {
    onDelete: 'CASCADE',
  })
  carts: Cart[];

  @OneToMany(() => Wishlist, (wishlist) => wishlist.customer, {
    onDelete: 'CASCADE',
  })
  wishlists: Wishlist[];

  @OneToMany(
    () => CustomerNotification,
    (customerNotification) => customerNotification.customer,
  )
  customerNotifications: CustomerNotification[];
}
