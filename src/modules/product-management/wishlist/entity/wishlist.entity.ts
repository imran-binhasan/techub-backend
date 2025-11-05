import { Customer } from 'src/modules/personnel-management/customer/entity/customer.entity';
import { BaseEntity } from 'src/shared/entity/base.entity';
import { DeleteDateColumn, Entity, ManyToOne, Unique } from 'typeorm';
import { Product } from '../../product/entity/product.entity';

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
