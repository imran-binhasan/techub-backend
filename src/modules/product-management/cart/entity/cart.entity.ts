import { Customer } from 'src/modules/personnel-management/customer/entity/customer.entity';
import { BaseEntity } from 'src/shared/entity/base.entity';
import { Entity, ManyToOne, Column, JoinColumn, Unique } from 'typeorm';
import { Product } from '../../product/entity/product.entity';

@Entity('cart')
export class Cart extends BaseEntity {
  @Column()
  customerId: number;

  @Column()
  productId: number;

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
