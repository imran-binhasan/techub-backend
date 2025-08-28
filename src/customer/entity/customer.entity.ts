import { Base } from 'src/common/entity/base.entity';
import { Address } from 'src/address/entity/address.entity';
import { Cart } from 'src/cart/entity/cart.entity';
import { Notification } from 'src/notification/entity/notification.entity';
import { Wishlist } from 'src/wishlist/entity/wishlist.entity';
import { 
  Column, 
  Entity, 
  OneToMany, 
} from 'typeorm';

@Entity('customer')
export class Customer extends Base {
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
    onDelete: 'CASCADE'
  })
  addresses: Address[];

  @OneToMany(() => Cart, cart => cart.customer, {
    onDelete: 'CASCADE'
  })
  carts: Cart[];

  @OneToMany(() => Wishlist, wishlist => wishlist.customer, {
    onDelete: 'CASCADE'
  })
  wishlists: Wishlist[];

  @OneToMany(() => Notification, notification => notification.customers, {
    onDelete: 'CASCADE'
  })
  notifications: Notification[];

}