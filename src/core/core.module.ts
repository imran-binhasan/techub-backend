import { Module } from '@nestjs/common';
import { RabbitMQModule } from './rabbitmq/module/rabbitmq.module';
import { RedisModule } from './redis/module/redis.module';
import { CacheModule } from './cache/module/cache.module';
import { UploadModule } from './upload/module/upload.module';
import { AuthModule } from './auth/module/auth.module';

@Module({
  imports: [RedisModule, CacheModule, RabbitMQModule.forRootAsync(), UploadModule, AuthModule],
  controllers: [],
  providers: [],
})
export class CoreModule {}
