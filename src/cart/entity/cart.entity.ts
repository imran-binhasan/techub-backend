import { Customer } from "src/customer/entity/customer.entity";
import { Product } from "src/product/entity/product.entity";
import { Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('cart')
export class Cart {
    @PrimaryGeneratedColumn('uuid')
    id:string;

    @ManyToOne(()=> Customer, customer => customer.carts, {onDelete:'CASCADE'})
    customer: Customer;

    @ManyToOne(()=> Product, product => product.carts, {onDelete: 'CASCADE'})
    product:Product;
}