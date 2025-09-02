// src/cache/module/cache.module.ts
import { Module, Global } from '@nestjs/common';
import { CacheService } from '../service/cache.service';
import { RedisModule } from 'src/redis/module/redis.module';
import { AuthModule } from 'src/auth/module/auth.module';

@Global()
@Module({
  imports: [AuthModule, RedisModule],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
