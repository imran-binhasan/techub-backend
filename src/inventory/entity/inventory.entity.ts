import { Base } from 'src/common/entity/base.entity';
import { Product } from 'src/product/entity/product.entity';
import { Column, Entity, ManyToOne, OneToMany, Index } from 'typeorm';
import { InventoryTransaction } from './inventory-transaction.entity';

@Entity('inventory')
@Index(['product'])
export class Inventory extends BaseEntity {
  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  product: Product;

  @Column({ type: 'int', default: 0 })
  currentStock: number;

  @Column({ type: 'int', default: 10 })
  reorderLevel: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  location?: string;

  @Column({ type: 'timestamptz', nullable: true })
  lastStockUpdate: Date;

  @OneToMany(
    () => InventoryTransaction,
    (transaction) => transaction.inventory,
    {
      cascade: true,
    },
  )
  transactions: InventoryTransaction[];
}
