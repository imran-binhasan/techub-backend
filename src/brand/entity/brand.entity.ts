import { Product } from "src/product/entity/product.entity";
import { Column, Entity, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('brand')
export class Brand {
    @PrimaryGeneratedColumn('uuid')
    id:string;

    @Column()
    name:string;

    @OneToMany(()=> Product, product => product.brand)
    products: Product[];
}