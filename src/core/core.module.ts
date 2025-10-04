import { Module } from '@nestjs/common';
import { RabbitMQModule } from './rabbitmq/module/rabbitmq.module';
import { RedisModule } from './redis/module/redis.module';
import { CacheModule } from './cache/module/cache.module';
import { UploadModule } from './upload/module/upload.module';
import { AuthModule } from './auth/module/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import databaseConfig, {
  databaseValidationSchema,
} from './database/database.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseConfig } from './database/database.interface';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { HttpExceptionFilter } from 'src/shared/filter/http-exception.filter';
import { ResponseInterceptor } from 'src/shared/interceptor/response.interceptor';
import { JwtAuthGuard } from './auth/guard/jwt-auth-guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
      validationSchema: databaseValidationSchema,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get<DatabaseConfig>('database');
        if (!dbConfig) {
          throw new Error('Database config is missing');
        }
        return dbConfig;
      },
    }),
    RedisModule,
    CacheModule,
    RabbitMQModule.forRootAsync(),
    UploadModule,
    AuthModule,
  ],
  controllers: [],
  providers: [
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class CoreModule {}
