import { BaseEntity } from 'src/shared/entity/base.entity';
import { Column, DeleteDateColumn, Entity, OneToMany } from 'typeorm';
import { CustomerNotification } from './customer-notification';

@Entity('notification')
export class Notification extends BaseEntity {
  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  // Remove the ManyToMany - only use the junction table approach
  @OneToMany(
    () => CustomerNotification,
    (customerNotification) => customerNotification.notification,
    {
      cascade: true,
    },
  )
  customerNotifications: CustomerNotification[];
}
