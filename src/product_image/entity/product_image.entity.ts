import { Base } from 'src/common/entity/base.entity';
import { Product } from 'src/product/entity/product.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@Entity('product_image')
export class ProductImage extends BaseEntity {
  @Column()
  url: string;

  @Column({ nullable: true })
  altText: string;

  @Column({ default: false })
  isPrimary: boolean;

  @Column({ nullable: true })
  sortOrder: number;

  @ManyToOne(() => Product, (product) => product.images, {
    onDelete: 'CASCADE',
  })
  product: Product;
}
