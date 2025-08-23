import { Base } from "src/common/entity/base.entity";
import { Product } from "src/product/entity/product.entity";
import { Column, Entity, ManyToOne } from "typeorm";

@Entity('product_image')
export class ProductImage extends Base {        
    @Column()
    url: string;

    @ManyToOne(()=> Product, product=> product.images, {onDelete: 'CASCADE'})
    product:Product;
}