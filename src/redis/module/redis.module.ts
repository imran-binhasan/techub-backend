import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const client = new Redis({
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
          username: configService.get<string>('REDIS_USERNAME') ?? 'default',
          password: configService.get<string>('REDIS_PASSWORD'),
          tls:
            configService.get<string>('REDIS_TLS') === 'true' ? {} : undefined,
        });

        client.on('connect', () => console.log('Redis connected'));
        client.on('error', (err) => console.error('Redis Error', err));

        return client;
      },
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}
