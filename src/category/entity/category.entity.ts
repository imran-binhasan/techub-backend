import { Product } from "src/product/entity/product.entity";
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('category')
export class Category {
    @PrimaryGeneratedColumn('uuid')
    id:string;

    @Column()
    name:string;

    @ManyToOne(()=> Category, category => category.children, {nullable:true, onDelete:'CASCADE'})
    parent: Category;

    @OneToMany(()=> Category, category => category.parent)
    children:Category[];

    @OneToMany(()=> Product, product => product.category)
    products: Product[];
}