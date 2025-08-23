import { Customer } from "src/customer/entity/customer.entity";
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('wishlist')
export class Wishlist {
    @PrimaryGeneratedColumn('uuid')
    id: number;

    @ManyToOne(()=> Customer, customer => customer.wishlists, {onDelete: 'CASCADE'})
    customer:Customer;
}