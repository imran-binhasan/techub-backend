import { Base } from 'src/common/entity/base.entity';
import { Column, Entity } from 'typeorm';

export enum PaymentMethod {
  CASH_ON_DELIVERY = 'cash_on_delivery',
  SSL = 'ssl',
  STRIPE = 'stripe',
}

@Entity('payment')
export class Payment extends BaseEntity {
  @Column()
  totalAmount: number;

  @Column({ type: 'timestamptz' })
  orderDate: Date;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.CASH_ON_DELIVERY,
  })
  method: PaymentMethod;
}
