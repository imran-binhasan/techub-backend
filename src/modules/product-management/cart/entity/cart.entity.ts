import { Customer } from 'src/modules/personnel-management/customer/entity/customer.entity';
import { BaseEntity } from 'src/shared/entity/base.entity';
import { Entity, ManyToOne, Column, JoinColumn, Index } from 'typeorm';
import { Product } from '../../product/entity/product.entity';
import { CartStatus, CartSource } from '../enum/cart.enum';

@Entity('cart')
@Index(['customerId', 'productId'], { unique: true }) // Prevent duplicate product in same cart
@Index(['customerId', 'status']) // Optimize queries by customer and status
@Index(['status', 'expiresAt']) // Optimize expired cart cleanup
export class Cart extends BaseEntity {
  @Column()
  customerId: number;

  @Column()
  productId: number;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  // Cart item status
  @Column({
    type: 'enum',
    enum: CartStatus,
    default: CartStatus.ACTIVE,
  })
  status: CartStatus;

  // Track where the item was added from
  @Column({
    type: 'enum',
    enum: CartSource,
    default: CartSource.WEB,
  })
  source: CartSource;

  // Selected product attributes/variants (e.g., size, color)
  // Stored as JSON: { "size": "L", "color": "red" }
  @Column({ type: 'jsonb', nullable: true })
  selectedAttributes?: Record<string, any>;

  // Price at the time of adding to cart (for price change detection)
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  priceSnapshot?: number;

  // Expiration date for cart cleanup
  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  // Additional notes from customer
  @Column({ type: 'text', nullable: true })
  notes?: string;

  // Metadata for additional information
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  // Relationships
  @ManyToOne(() => Customer, (customer) => customer.carts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @ManyToOne(() => Product, (product) => product.carts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;
}
