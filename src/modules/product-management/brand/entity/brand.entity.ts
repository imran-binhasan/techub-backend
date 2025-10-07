import { BaseEntity } from 'src/shared/entity/base.entity';
import { Column, Entity, OneToMany, DeleteDateColumn } from 'typeorm';
import { Product } from '../../product/entity/product.entity';

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

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt: Date;
}
