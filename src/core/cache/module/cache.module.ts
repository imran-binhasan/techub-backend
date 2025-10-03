// src/cache/module/cache.module.ts
import { Module, Global } from '@nestjs/common';
import { CacheService } from '../service/cache.service';
import { RedisModule } from 'src/core/redis/module/redis.module';

@Global()
@Module({
  imports: [RedisModule],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
