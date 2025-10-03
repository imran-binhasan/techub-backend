import { BaseEntity } from 'src/shared/entity/base.entity';
import { Product } from 'src/product-management/product/entity/product.entity';
import { Column, Entity, OneToMany } from 'typeorm';

@Entity('brand')
export class Brand extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  logo?: string;

  @OneToMany(() => Product, (product) => product.brand)
  products: Product[];
}
