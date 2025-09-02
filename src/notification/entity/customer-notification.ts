import { Base } from 'src/common/entity/base.entity';
import { Customer } from 'src/customer/entity/customer.entity';
import { Notification } from './notification.entity';
import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';

@Entity('customer_notification')
export class CustomerNotification extends Base {
  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  readAt: Date | null;

  @ManyToOne(() => Customer, (customer) => customer.customerNotifications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @ManyToOne(
    () => Notification,
    (notification) => notification.customerNotifications,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'notificationId' })
  notification: Notification;
}
