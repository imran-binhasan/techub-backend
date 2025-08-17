import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { HttpExceptionFilter } from './common/filter/http-exception.filter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResponseInterceptor } from './common/interceptor/response.interceptor';
import { AuthModule } from './auth/module/auth.module';
import { AdminModule } from './admin/module/admin.module';
import { RoleModule } from './role/module/role.module';
import { PermissionModule } from './permission/module/permission.module';

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
        synchronize: configService.get<string>('NODE_ENV') == 'development',
        autoLoadEntities: true,
        ssl: { rejectUnauthorized: false }
      })
    }),
    AuthModule,
    AdminModule,
    RoleModule,
    PermissionModule
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_FILTER, useClass: HttpExceptionFilter }, { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor }],
})
export class AppModule { }
