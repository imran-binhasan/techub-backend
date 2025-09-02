import { Base } from 'src/common/entity/base.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { CustomerNotification } from './customer-notification';

@Entity('notification')
export class Notification extends Base {
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
