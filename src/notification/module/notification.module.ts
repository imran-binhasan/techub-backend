import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from 'src/customer/entity/customer.entity';
import { CustomerNotification } from '../entity/customer-notification';
import { NotificationController } from '../controller/notification.controller';
import { NotificationService } from '../service/notification.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, CustomerNotification, Customer]),
  ],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
