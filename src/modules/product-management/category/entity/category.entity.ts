import { BaseEntity } from 'src/shared/entity/base.entity';
import { Column, Entity, ManyToOne, OneToMany, Index } from 'typeorm';
import { Product } from '../../product/entity/product.entity';

@Entity('category')
@Index(['slug'])
@Index(['isVisible', 'parent'])
@Index(['displayOrder'])
export class Category extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index()
  slug: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  icon?: string;

  // SEO Fields
  @Column({
    type: 'varchar',
    length: 60,
    nullable: true,
    name: 'meta_title',
  })
  metaTitle?: string;

  @Column({
    type: 'varchar',
    length: 160,
    nullable: true,
    name: 'meta_description',
  })
  metaDescription?: string;

  // Display Configuration
  @Column({
    type: 'int',
    default: 0,
    name: 'display_order',
  })
  @Index()
  displayOrder: number;

  @Column({
    type: 'boolean',
    default: true,
    name: 'is_visible',
  })
  @Index()
  isVisible: boolean;

  // Statistics
  @Column({
    type: 'int',
    default: 0,
    name: 'products_count',
  })
  productsCount: number;

  // Relationships
  @ManyToOne(() => Category, (category) => category.children, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  parent?: Category;

  @OneToMany(() => Category, (category) => category.parent)
  children: Category[];

  @OneToMany(() => Product, (product) => product.category)
  products: Product[];
}
