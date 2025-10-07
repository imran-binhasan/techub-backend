import { BaseEntity } from 'src/shared/entity/base.entity';
import { Product } from 'src/modules/product-management/product/entity/product.entity';
import { Column, Entity, ManyToOne, DeleteDateColumn } from 'typeorm';

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

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt: Date;
}
