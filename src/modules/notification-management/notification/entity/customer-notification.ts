import { BaseEntity } from 'src/shared/entity/base.entity';
import { Notification } from './notification.entity';
import { Column, Entity, ManyToOne, JoinColumn, DeleteDateColumn } from 'typeorm';
import { Customer } from 'src/modules/personnel-management/customer/entity/customer.entity';

@Entity('customer_notification')
export class CustomerNotification extends BaseEntity {
  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  readAt: Date | null;

  @ManyToOne(() => Customer, (customer) => customer.notifications, {
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

  @DeleteDateColumn()
  deletedAt: Date | null;
}
