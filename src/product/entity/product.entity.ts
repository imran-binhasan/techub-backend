import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('product')
export class Product {
    @PrimaryGeneratedColumn('uuid')
    id:number;

    @Column()
    name:string;

    @Column()
    description:string;

    @Column()
    stock:number;

    @Column()
    price:number
}