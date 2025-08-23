import { Base } from "src/common/entity/base.entity";
import { Product } from "src/product/entity/product.entity";
import { Column, Entity, OneToMany } from "typeorm";

@Entity('brand')
export class Brand extends Base {

    @Column()
    name:string;

    @OneToMany(()=> Product, product => product.brand)
    products: Product[];
}