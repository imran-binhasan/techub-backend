import { Base } from "src/common/entity/base.entity";
import { Product } from "src/product/entity/product.entity";
import { Column, Entity, ManyToOne } from "typeorm";

@Entity('product_review')
export class ProductReview extends Base {
    @Column()
    rating: number;

    @Column()
    name: string;

    @Column()
    comment: string;
    
    @ManyToOne(()=> Product, product => product.rating)
    product: Product;
}