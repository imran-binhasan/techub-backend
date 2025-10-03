import { Brand } from 'src/product-management/brand/entity/brand.entity';
import { Cart } from 'src/product-management/cart/entity/cart.entity';
import { Category } from 'src/product-management/category/entity/category.entity';
import { BaseEntity } from 'src/shared/entity/base.entity';
import { ProductImage } from 'src/product-management/product_image/entity/product_image.entity';
import { ProductReview } from 'src/product-management/product_review/entity/product_review.entity';
import { Column, Entity, ManyToMany, ManyToOne, OneToMany } from 'typeorm';
import { ProductAttributeValue } from './product_attribute_value.entity';
import { Wishlist } from 'src/product-management/wishlist/entity/wishlist.entity';
import { Inventory } from 'src/modules/order-management/inventory/entity/inventory.entity';

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
}
