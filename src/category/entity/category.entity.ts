import { Product } from 'src/product/entity/product.entity';
import { Base } from 'src/common/entity/base.entity';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';

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
}
