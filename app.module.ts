import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { RequestIdMiddleware } from './src/shared/middleware/request-id.middleware';
import { CoreModule } from 'src/core/core.module';
import { PersonnelManagementModule } from 'src/modules/personnel-management/personnel-management.module';
import { ProductManagementModule } from 'src/modules/product-management/product-management.module';
import { OrderManagementModule } from 'src/modules/order-management/order-management.module';
import { NotificationManagementModule } from 'src/modules/notification-management/notification-management.module';

@Module({
  imports: [
    CoreModule,
    PersonnelManagementModule,
    ProductManagementModule,
    OrderManagementModule,
    NotificationManagementModule,
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
