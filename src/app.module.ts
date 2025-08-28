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
import { Attribute } from './attribute/entity/attribute.entity';
import { AttributeModule } from './attribute/module/attribute.module';
import { AttributeValueModule } from './attribute_value/module/attribute_value.module';
import { BrandModule } from './brand/module/brand.module';

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
dropSchema: true,
        logging: configService.get<string>('NODE_ENV') == 'development',
        autoLoadEntities: true,
        ssl: { rejectUnauthorized: false },
      }),
    }),
    AuthModule,
    AdminModule,
    RoleModule,
    PermissionModule,
    CustomerModule,
    ProductModule,
    AttributeModule,
    AttributeValueModule,
    BrandModule
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
