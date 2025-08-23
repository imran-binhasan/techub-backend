import { Brand } from "src/brand/entity/brand.entity";
import { Category } from "src/category/entity/category.entity";
import { ProductImage } from "src/product_image/entity/product_image.entity";
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('product')
export class Product {
    @PrimaryGeneratedColumn('uuid')
    id: number;

    @Column()
    name: string;

    @Column()
    description: string;

    @Column()
    stock: number;

    @Column()
    price: number

    @OneToMany(() => ProductImage, image => image.product)
    images: ProductImage[];

    @ManyToOne(()=> Category, category => category.products, {onDelete: 'SET NULL'})
    category: Category;

    @ManyToOne(() => Brand, brand => brand.products, { nullable: true, onDelete: 'SET NULL' })
    brand: Brand;
}