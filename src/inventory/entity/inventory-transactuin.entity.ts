import { Base } from 'src/common/entity/base.entity';
import { 
  Column, 
  Entity, 
  ManyToOne,
  Index,
} from 'typeorm';
import { Inventory } from './inventory.entity';

export enum TransactionType {
  IN = 'in',
  OUT = 'out',
  ADJUSTMENT = 'adjustment',
}

@Entity('inventory_transaction')
@Index(['inventory'])
@Index(['createdAt'])
export class InventoryTransaction extends Base {
  @ManyToOne(() => Inventory, inventory => inventory.transactions, { 
    onDelete: 'CASCADE' 
  })
  inventory: Inventory;

  @Column({ 
    type: 'enum', 
    enum: TransactionType 
  })
  type: TransactionType;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'int' })
  previousStock: number;

  @Column({ type: 'int' })
  newStock: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  reason?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  referenceId?: string;
}
