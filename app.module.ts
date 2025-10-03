import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { HttpExceptionFilter } from './src/shared/filter/http-exception.filter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResponseInterceptor } from './shared/common/interceptor/response.interceptor';
import { JwtAuthGuard } from './src/core/auth/guard/jwt-auth-guard';
import { RequestIdMiddleware } from './src/shared/middleware/request-id.middleware';
import { InventoryModule } from './src/modules/order-management/inventory/module/inventory.module';
import { NotificationModule } from './src/modules/notification-management/notification/module/notification.module';
import { SmsModule } from './src/modules/notification-management/sms/module/sms.module';
import { OrderModule } from './src/modules/order-management/order/module/order.module';
import { PaymentModule } from './payment/module/payment.module';
import { PaymentGatewayModule } from './src/modules/order-management/payment-gateway/payment-gateway.module';
import { CoreModule } from 'src/core/core.module';
import { PersonnelManagementModule } from 'src/modules/personnel-management/personnel-management.module';
import { ProductManagementModule } from 'src/modules/product-management/product-management.module';

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
    PersonnelManagementModule,
    ProductManagementModule,
    InventoryModule,
    NotificationModule,
    SmsModule,
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
