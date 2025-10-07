import { BaseEntity } from 'src/shared/entity/base.entity';
import { Column, Entity, ManyToOne, OneToMany, DeleteDateColumn } from 'typeorm';
import { Product } from '../../product/entity/product.entity';

@Entity('category')
export class Category extends BaseEntity {
  @Column()
  name: string;

  @ManyToOne(() => Category, (category) => category.children, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  parent: Category;

  @OneToMany(() => Category, (category) => category.parent)
  children: Category[];

  @OneToMany(() => Product, (product) => product.category)
  products: Product[];

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt: Date;
}
