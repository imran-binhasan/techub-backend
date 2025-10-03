import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { HttpExceptionFilter } from './src/shared/filter/http-exception.filter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResponseInterceptor } from './shared/common/interceptor/response.interceptor';
import { AdminModule } from './user-management/admin/module/admin.module';
import { RoleModule } from './user-management/role/module/role.module';
import { PermissionModule } from './user-management/permission/module/permission.module';
import { JwtAuthGuard } from './src/core/auth/guard/jwt-auth-guard';
import { RequestIdMiddleware } from './src/shared/middleware/request-id.middleware';
import { CustomerModule } from './user-management/customer/module/customer.module';
import { ProductModule } from './product-management/product/module/product.module';
import { AttributeModule } from './product-management/attribute/module/attribute.module';
import { AttributeValueModule } from './product-management/attribute_value/module/attribute_value.module';
import { BrandModule } from './product-management/brand/module/brand.module';
import { CategoryModule } from './product-management/category/module/category.module';
import { CartModule } from './product-management/cart/module/cart.module';
import { CouponModule } from './product-management/coupon/module/coupon.module';
import { InventoryModule } from './src/modules/order-management/inventory/module/inventory.module';
import { NotificationModule } from './src/modules/notification-management/notification/module/notification.module';
import { ProductImageModule } from './product-management/product_image/module/product_image.module';
import { ProductReviewModule } from './product-management/product_review/module/product_review.module';
import { WishlistModule } from './product-management/wishlist/module/wishlist.module';
import { SmsModule } from './src/modules/notification-management/sms/module/sms.module';
import { AddressModule } from './user-management/address/module/address.module';
import { OrderModule } from './src/modules/order-management/order/module/order.module';
import { PaymentModule } from './payment/module/payment.module';
import { PaymentGatewayModule } from './src/modules/order-management/payment-gateway/payment-gateway.module';
import { CoreModule } from 'src/core/core.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        synchronize: true,
        logging: configService.get<string>('NODE_ENV') == 'development',
        autoLoadEntities: true,
        ssl: { rejectUnauthorized: false },
      }),
    }),
    CoreModule,
    AdminModule,
    RoleModule,
    PermissionModule,
    CustomerModule,
    ProductModule,
    AttributeModule,
    AttributeValueModule,
    BrandModule,
    CategoryModule,
    CartModule,
    CouponModule,
    InventoryModule,
    NotificationModule,
    ProductImageModule,
    ProductReviewModule,
    WishlistModule,
    SmsModule,
    AddressModule,
    OrderModule,
    PaymentModule,
    PaymentGatewayModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
