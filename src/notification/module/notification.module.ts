import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from 'src/customer/entity/customer.entity';
import { Notification } from '../entity/notification.entity';
import { CustomerNotification } from '../entity/customer-notification';
import { NotificationController } from '../controller/notification.controller';
import { NotificationService } from '../service/notification.service';
import { AuthModule } from 'src/auth/module/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, CustomerNotification, Customer]),
    AuthModule,
  ],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
