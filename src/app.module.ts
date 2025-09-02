import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { HttpExceptionFilter } from './common/filter/http-exception.filter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResponseInterceptor } from './common/interceptor/response.interceptor';
import { AdminModule } from './admin/module/admin.module';
import { RoleModule } from './role/module/role.module';
import { PermissionModule } from './permission/module/permission.module';
import { JwtAuthGuard } from './auth/guard/jwt-auth-guard';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { CustomerModule } from './customer/module/customer.module';
import { AuthModule } from './auth/module/auth.module';
import { ProductModule } from './product/module/product.module';
import { AttributeModule } from './attribute/module/attribute.module';
import { AttributeValueModule } from './attribute_value/module/attribute_value.module';
import { BrandModule } from './brand/module/brand.module';
import { RedisModule } from './redis/module/redis.module';
import { CacheModule } from './cache/module/cache.module';
import { RabbitMQModule } from './rabbitmq/module/rabbitmq.module';
import { UploadModule } from './upload/module/upload.module';
import { CategoryModule } from './category/module/category.module';
import { CartModule } from './cart/module/cart.module';
import { CouponModule } from './coupon/module/coupon.module';
import { InventoryModule } from './inventory/module/inventory.module';
import { NotificationModule } from './notification/module/notification.module';
import { ProductImageModule } from './product_image/module/product_image.module';
import { ProductReviewModule } from './product_review/module/product_review.module';
import { WishlistModule } from './wishlist/module/wishlist.module';
import { SmsModule } from './sms/module/sms.module';
import { AddressModule } from './address/module/address.module';
import { OrderModule } from './order/module/order.module';
import { PaymentModule } from './payment/module/payment.module';
import { PaymentGatewayModule } from './payment-gateway/payment-gateway.module';

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
    RedisModule,
    CacheModule,
    RabbitMQModule.forRootAsync(),
    UploadModule,
    AuthModule,
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
