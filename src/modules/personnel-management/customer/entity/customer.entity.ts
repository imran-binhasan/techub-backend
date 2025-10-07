import { BaseEntity } from 'src/shared/entity/base.entity';
import { Column, DeleteDateColumn, Entity, OneToMany, OneToOne } from 'typeorm';
import { CustomerNotification } from 'src/modules/notification-management/notification/entity/customer-notification';
import { Address } from '../../address/entity/address.entity';
import { Cart } from 'src/modules/product-management/cart/entity/cart.entity';
import { Wishlist } from 'src/modules/product-management/wishlist/entity/wishlist.entity';
import { User } from '../../user/entity/user.entity';

@Entity('customer')
export class Customer extends BaseEntity {

  @OneToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  user: User;

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
