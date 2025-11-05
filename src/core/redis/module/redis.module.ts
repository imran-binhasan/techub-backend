import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisService } from '../service/redis.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        // Try to get from environment variables first
        let host = configService.get<string>('REDIS_HOST');
        let port = configService.get<number>('REDIS_PORT');
        let username = configService.get<string>('REDIS_USERNAME');
        let password = configService.get<string>('REDIS_PASSWORD');
        let useTLS = configService.get<string>('REDIS_TLS') === 'true';

        console.log('Environment Redis config:', {
          host,
          port,
          username: !!username,
          password: !!password,
          useTLS,
        });

        // Fallback to Redis Cloud configuration if env vars not found
        if (!host || !port || !password) {
          console.log('Using fallback Redis Cloud configuration');
          host = 'redis-16855.c252.ap-southeast-1-1.ec2.redns.redis-cloud.com';
          port = 16855;
          username = 'default';
          password = 'wb2RPMyMwavJ28WvVwwkDqvmaXRKxRBm';
          useTLS = false; // Redis Cloud instance doesn't use TLS based on redis:// URL
        }

        // Special override for this specific Redis Cloud instance (doesn't use TLS)
        if (
          host === 'redis-16855.c252.ap-southeast-1-1.ec2.redns.redis-cloud.com'
        ) {
          console.log('Overriding TLS to false for this Redis Cloud instance');
          useTLS = false;
        }

        let client: Redis;

        try {
          console.log(
            `Connecting to Redis Cloud: ${host}:${port} (TLS: ${useTLS})`,
          );

          client = new Redis({
            host,
            port,
            username,
            password,
            connectTimeout: 15000,
            lazyConnect: false,
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
            ...(useTLS && {
              tls: {
                rejectUnauthorized: false,
                servername: host,
              },
            }),
            family: 4, // Force IPv4
          });

          client.on('connect', () =>
            console.log('✅ Redis connected successfully'),
          );
          client.on('error', (err) =>
            console.error('❌ Redis Error:', err.message),
          );
          client.on('ready', () =>
            console.log('🚀 Redis ready for operations'),
          );
          client.on('close', () => console.log('🔌 Redis connection closed'));
          client.on('reconnecting', () =>
            console.log('🔄 Redis reconnecting...'),
          );

          // Test the connection immediately
          await client.ping();
          console.log('✅ Redis ping successful');

          return client;
        } catch (error) {
          console.error('❌ Failed to create Redis client:', error.message);
          throw error;
        }
      },
    },
    RedisService,
  ],
  exports: ['REDIS_CLIENT', RedisService],
})
export class RedisModule {}
