import {
  Column,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
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

@Entity('product')
export class Product extends BaseEntity {
  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  stock: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @OneToMany(() => ProductImage, (image) => image.product)
  images: ProductImage[];

  @ManyToOne(() => Category, (category) => category.products, {
    onDelete: 'SET NULL',
  })
  category: Category;

  @ManyToOne(() => Brand, (brand) => brand.products, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  brand: Brand;

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
  vendor: Vendor;
}
