import { Address } from "src/address/entity/address.entity";
import { Cart } from "src/cart/entity/cart.entity";
import { Base } from "src/common/entity/base.entity";
import { Notification } from "src/notification/entity/notification.entity";
import { Wishlist } from "src/wishlist/entity/wishlist.entity";
import { Column, Entity, OneToMany } from "typeorm";

@Entity('customer')
export class Customer extends Base {
    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column({ unique: true })
    email: string;

    @Column({ nullable: true })
    phone: string;

    @Column({ select: false })
    password: string;

    @Column({ nullable: true })
    image?: string;

    @OneToMany(() => Address, (address) => address.customer)
    addresses: Address[];

    @OneToMany(() => Cart, cart => cart.customer)
    carts: Cart[];

    @OneToMany(() => Wishlist, wishlist => wishlist.customer)
    wishlists: Wishlist[];

    @OneToMany(()=> Notification, notification => notification.customer)
    notifications: Notification[];
}