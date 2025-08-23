import { Address } from "src/address/entity/address.entity";
import { Cart } from "src/cart/entity/cart.entity";
import { Wishlist } from "src/wishlist/entity/wishlist.entity";
import { Column, DeleteDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('customer')
export class Customer {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    firstName:string;

    @Column()
    lastName:string;

    @Column({ unique: true })
    email:string;

    @Column({ nullable: true })
    phone:string;

    @Column({ select: false })
    password:string;

    @Column({ nullable: true })
    image?:string;

    @OneToMany(()=> Address, (address) => address.customer)
    addresses: Address[];

    @OneToMany(()=> Cart, cart => cart.customer)
    carts:Cart[];

    @OneToMany(()=> Wishlist, wishlist => wishlist.customer)
    wishlists:Wishlist[];

    @DeleteDateColumn({ nullable: true })
    deletedAt: Date;
}