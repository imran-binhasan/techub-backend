import {
  Column,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  Index,
  Unique,
} from 'typeorm';
import { ProductAttributeValue } from './product_attribute_value.entity';
import { Inventory } from 'src/modules/order-management/inventory/entity/inventory.entity';
import { BaseEntity } from 'src/shared/entity/base.entity';
import { ProductImage } from '../../product_image/entity/product_image.entity';
import { Category } from '../../category/entity/category.entity';
import { Brand } from '../../brand/entity/brand.entity';
import { Cart } from '../../cart/entity/cart.entity';
import { ProductReview } from '../../product_review/entity/product_review.entity';
import { Wishlist } from '../../wishlist/entity/wishlist.entity';
import { Vendor } from 'src/modules/personnel-management/vendor/entity/vendor.entity';
import {
  ProductStatus,
  ProductCondition,
  ProductVisibility,
  DiscountType,
} from '../enum/product.enum';

@Entity('product')
@Index(['status', 'isPublished'])
@Index(['categoryId', 'status'])
@Index(['brandId', 'status'])
@Index(['vendorId', 'status'])
@Index(['isFeatured', 'status'])
@Index(['avgRating', 'status'])
@Index(['price', 'status'])
@Index(['createdAt', 'status'])
export class Product extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  @Index()
  sku: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index()
  slug: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.DRAFT,
  })
  @Index()
  status: ProductStatus;

  @Column({
    type: 'enum',
    enum: ProductCondition,
    default: ProductCondition.NEW,
  })
  condition: ProductCondition;

  @Column({
    type: 'enum',
    enum: ProductVisibility,
    default: ProductVisibility.PUBLIC,
  })
  visibility: ProductVisibility;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    name: 'compare_at_price',
  })
  compareAtPrice?: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    name: 'cost_per_item',
  })
  costPerItem?: number;

  @Column({
    type: 'enum',
    enum: DiscountType,
    default: DiscountType.NONE,
    name: 'discount_type',
  })
  discountType: DiscountType;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
    name: 'discount_value',
  })
  discountValue: number;

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

  @Column({
    type: 'simple-array',
    nullable: true,
  })
  keywords?: string[];

  // Analytics and Statistics
  @Column({
    type: 'decimal',
    precision: 3,
    scale: 2,
    default: 0,
    name: 'avg_rating',
  })
  @Index()
  avgRating: number;

  @Column({ type: 'int', default: 0, name: 'review_count' })
  reviewCount: number;

  @Column({ type: 'int', default: 0, name: 'view_count' })
  @Index()
  viewCount: number;

  @Column({ type: 'int', default: 0, name: 'sales_count' })
  @Index()
  salesCount: number;

  // Feature Flags
  @Column({ type: 'boolean', default: false, name: 'is_featured' })
  @Index()
  isFeatured: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_published' })
  @Index()
  isPublished: boolean;

  // Foreign Key Columns (for indexes)
  @Column({ type: 'int', nullable: true, name: 'category_id' })
  @Index()
  categoryId?: number;

  @Column({ type: 'int', nullable: true, name: 'brand_id' })
  @Index()
  brandId?: number;

  @Column({ type: 'int', nullable: true, name: 'vendor_id' })
  @Index()
  vendorId?: number;

  // Relationships
  @OneToMany(() => ProductImage, (image) => image.product, {
    cascade: true,
  })
  images: ProductImage[];

  @ManyToOne(() => Category, (category) => category.products, {
    onDelete: 'SET NULL',
  })
  category?: Category;

  @ManyToOne(() => Brand, (brand) => brand.products, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  brand?: Brand;

  @OneToMany(() => Cart, (cart) => cart.product)
  carts: Cart[];

  @OneToMany(() => ProductReview, (review) => review.product)
  reviews: ProductReview[];

  @OneToMany(() => Wishlist, (wishlist) => wishlist.product)
  wishlists: Wishlist[];

  @OneToMany(() => Inventory, (inventory) => inventory.product, {
    cascade: true,
  })
  inventory: Inventory[];

  @OneToMany(() => ProductAttributeValue, (pav) => pav.product, {
    cascade: true,
  })
  attributeValues: ProductAttributeValue[];

  @ManyToOne(() => Vendor, (vendor) => vendor.products, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  vendor?: Vendor;
}
