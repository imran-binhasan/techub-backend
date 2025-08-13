import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { APP_FILTER } from '@nestjs/core';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
     imports:[ConfigModule],
     inject:[ConfigService],
     useFactory:(configService:ConfigService) => ({
      type:'postgres',
      host:configService.get<string>('DB_HOST'),
      port:configService.get<number>('DB_PORT'),
      username:configService.get<string>('DB_USER'),
      password:configService.get<string>('DB_PASSWORD'),
      database:configService.get<string>('DB_NAME'),
      synchronize:configService.get<string>('NODE_ENV')=='development',
      autoLoadEntities:true,
      ssl:{rejectUnauthorized:false}
     })
    })],
  controllers: [AppController],
  providers: [AppService, { provide: APP_FILTER, useClass: HttpExceptionFilter }],
})
export class AppModule { }
