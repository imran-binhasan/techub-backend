import { BaseEntity } from 'src/shared/entity/base.entity';
import { Column, Entity, OneToMany, OneToOne, JoinColumn, Index, ManyToOne, DeleteDateColumn } from 'typeorm';
import { User } from '../../user/entity/user.entity';
import { Address } from '../../address/entity/address.entity';
import { Wishlist } from 'src/modules/product-management/wishlist/entity/wishlist.entity';
import { Cart } from 'src/modules/product-management/cart/entity/cart.entity';
import { CustomerNotification } from 'src/modules/notification-management/notification/entity/customer-notification';


@Entity('customer')
export class Customer extends BaseEntity {
  @OneToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth?: Date;

  @Column({ name: 'gender', type: 'varchar', length: 20, nullable: true })
  gender?: string;

  @Column({ name: 'verified_at', type: 'timestamptz', nullable: true })
  verifiedAt?: Date;

  @OneToMany(() => Address, (address) => address.customer, {
    cascade: true,
  })
  addresses: Address[];


  @Column({ name: 'total_orders', type: 'integer', default: 0 })
  totalOrders: number;

  @Column({ name: 'total_spent', type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalSpent: number;

  @Column({ name: 'loyalty_points', type: 'integer', default: 0 })
  loyaltyPoints: number;

  @Column({ name: 'preferred_language', type: 'varchar', length: 10, nullable: true })
  preferredLanguage?: string; // 'en', 'bn',

  @OneToMany(() => Wishlist, (wishlist) => wishlist.customer, { nullable: true })
  wishlists: Wishlist[];

  @OneToMany(()=> Cart, (cart)=> cart.customer, {nullable:true})
  carts:Cart[]

  @OneToMany(() => CustomerNotification, (notification) => notification.customer, { nullable: true })
  notifications: CustomerNotification[];
}