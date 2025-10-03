import { Base } from 'src/common/entity/base.entity';
import { Product } from 'src/product/entity/product.entity';
import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from './order.entity';

@Entity('order_item')
export class OrderItem extends BaseEntity {
  @Column()
  orderId: string;

  @Column()
  productId: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalPrice: number;

  @Column({ type: 'varchar', length: 255 })
  productName: string; // Store product name at time of order

  @Column({ type: 'varchar', length: 255, nullable: true })
  productSku?: string;

  @Column({ type: 'text', nullable: true })
  productDescription?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  productImage?: string; // Store main product image URL

  @Column({ type: 'json', nullable: true })
  productAttributes?: Record<string, any>; // Store selected attributes like size, color

  // Relations
  @ManyToOne(() => Order, (order) => order.orderItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;
}
