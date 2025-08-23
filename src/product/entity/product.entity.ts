import { Brand } from "src/brand/entity/brand.entity";
import { Cart } from "src/cart/entity/cart.entity";
import { Category } from "src/category/entity/category.entity";
import { Base } from "src/common/entity/base.entity";
import { ProductImage } from "src/product_image/entity/product_image.entity";
import { ProductReview } from "src/product_review/entity/product_review.entity";
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('product')
export class Product extends Base {

    @Column()
    name: string;

    @Column()
    description: string;

    @Column()
    stock: number;

    @Column()
    price: number;

    @OneToMany(() => ProductImage, image => image.product)
    images: ProductImage[];

    @ManyToOne(()=> Category, category => category.products, {onDelete: 'SET NULL'})
    category: Category;

    @ManyToOne(() => Brand, brand => brand.products, { nullable: true, onDelete: 'SET NULL' })
    brand: Brand;

    @OneToMany(()=> Cart, cart => cart.product)
    carts: Cart[];

    @OneToMany(()=> ProductReview, review => review.product)
    reviews: ProductReview[];
}