// src/wishlist/entity/wishlist.entity.ts
import { BaseEntity } from 'src/shared/entity/base.entity';
import { Customer } from 'src/user-management/customer/entity/customer.entity';
import { Product } from 'src/product-management/product/entity/product.entity';
import { Entity, ManyToOne, Unique } from 'typeorm';

@Entity('wishlist')
@Unique(['customer', 'product'])
export class Wishlist extends BaseEntity {
  @ManyToOne(() => Customer, (customer) => customer.wishlists, {
    onDelete: 'CASCADE',
  })
  customer: Customer;

  @ManyToOne(() => Product, (product) => product.wishlists, {
    onDelete: 'CASCADE',
  })
  product: Product;
}
