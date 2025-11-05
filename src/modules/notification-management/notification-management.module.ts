import { Module } from '@nestjs/common';
import { NotificationModule } from './notification/module/notification.module';
import { SmsModule } from './sms/module/sms.module';
import { EmailModule } from './email/module/email.module';

/**
 * Notification Management Module
 * Aggregates all notification-related modules (email, SMS, notifications)
 */
@Module({
  imports: [NotificationModule, SmsModule, EmailModule],
  controllers: [],
  providers: [],
  exports: [NotificationModule, SmsModule, EmailModule],
})
export class NotificationManagementModule {}
