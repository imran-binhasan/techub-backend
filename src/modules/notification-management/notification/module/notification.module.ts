import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from '../entity/notification.entity';
import { CustomerNotification } from '../entity/customer-notification';
import { NotificationController } from '../controller/notification.controller';
import { NotificationService } from '../service/notification.service';
import { AuthModule } from 'src/core/auth/module/auth.module';
import { Customer } from 'src/modules/personnel-management/customer/entity/customer.entity';

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
