import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { HttpExceptionFilter } from './src/shared/filter/http-exception.filter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtAuthGuard } from './src/core/auth/guard/jwt-auth-guard';
import { RequestIdMiddleware } from './src/shared/middleware/request-id.middleware';
import { NotificationModule } from './src/modules/notification-management/notification/module/notification.module';
import { SmsModule } from './src/modules/notification-management/sms/module/sms.module';
import { CoreModule } from 'src/core/core.module';
import { PersonnelManagementModule } from 'src/modules/personnel-management/personnel-management.module';
import { ProductManagementModule } from 'src/modules/product-management/product-management.module';
import { OrderManagementModule } from 'src/modules/order-management/order-management.module';
import { ResponseInterceptor } from 'src/shared/interceptor/response.interceptor';

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
    OrderManagementModule,
    NotificationModule,
    SmsModule,
  ],
  controllers: [],
  providers: [
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
