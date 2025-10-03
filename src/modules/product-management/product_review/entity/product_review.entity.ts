import { BaseEntity } from 'src/shared/entity/base.entity';
import { Product } from 'src/product-management/product/entity/product.entity';
import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';

@Entity('product_review')
export class ProductReview extends BaseEntity {
  @Column({ type: 'int', width: 1 })
  rating: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text' })
  comment: string;

  @ManyToOne(() => Product, (product) => product.reviews, {
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'productId' })
  product: Product;
}
