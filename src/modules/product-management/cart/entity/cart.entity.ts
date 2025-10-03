import { BaseEntity } from 'src/shared/entity/base.entity';
import { Customer } from 'src/user-management/customer/entity/customer.entity';
import { Product } from 'src/product-management/product/entity/product.entity';
import { Entity, ManyToOne, Column, JoinColumn, Unique } from 'typeorm';

@Entity('cart')
export class Cart extends BaseEntity {
  @Column()
  customerId: string;

  @Column()
  productId: string;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @ManyToOne(() => Customer, (customer) => customer.carts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @ManyToOne(() => Product, (product) => product.carts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;
}
