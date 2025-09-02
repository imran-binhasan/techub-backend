import { Base } from 'src/common/entity/base.entity';
import { Column, Entity } from 'typeorm';

export enum OrderStatus {
  PENDING = 'pending',
  CANCELLED = 'cancelled',
  CONFIRMED = 'confirmed',
  IN_TRANSIT = 'in_transit',
  COMPLETED = 'completed',
}

@Entity('order')
export class Order extends Base {
  @Column()
  totalAmount: number;

  @Column({ type: 'timestamptz' })
  orderDate: Date;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;
}
