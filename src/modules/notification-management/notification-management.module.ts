import { Module } from "@nestjs/common";
import { NotificationModule } from "./notification/module/notification.module";
import { SmsModule } from "./sms/module/sms.module";

@Module({
    imports: [NotificationModule, SmsModule],
    controllers: [],
    providers: [],
})

export class NotificationManagementModule {}