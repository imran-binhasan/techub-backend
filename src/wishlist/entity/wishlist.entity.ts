// src/wishlist/entity/wishlist.entity.ts
import { Base } from 'src/common/entity/base.entity';
import { Customer } from 'src/customer/entity/customer.entity';
import { Product } from 'src/product/entity/product.entity';
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
