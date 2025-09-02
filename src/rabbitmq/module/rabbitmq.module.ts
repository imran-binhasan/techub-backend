import { Module, Global, DynamicModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RabbitMQModule as NestRabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { RabbitMQService } from '../service/rabbitmq.service';

export interface RabbitMQModuleOptions {
  exchanges?: Array<{
    name: string;
    type: 'direct' | 'topic' | 'headers' | 'fanout';
  }>;
  queues?: Array<{
    name: string;
    exchange: string;
    routingKey?: string;
  }>;
}

@Global()
@Module({})
export class RabbitMQModule {
  static forRootAsync(options?: RabbitMQModuleOptions): DynamicModule {
    return {
      module: RabbitMQModule,
      imports: [
        ConfigModule,
        EventEmitterModule.forRoot(),
        NestRabbitMQModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: async (configService: ConfigService) => ({
            exchanges: [
              // Default ecommerce exchanges
              {
                name: 'ecommerce.events',
                type: 'topic',
                options: { durable: true },
              },
              {
                name: 'ecommerce.notifications',
                type: 'direct',
                options: { durable: true },
              },
              {
                name: 'ecommerce.orders',
                type: 'topic',
                options: { durable: true },
              },
              {
                name: 'ecommerce.payments',
                type: 'direct',
                options: { durable: true },
              },
              {
                name: 'ecommerce.inventory',
                type: 'topic',
                options: { durable: true },
              },
              {
                name: 'ecommerce.deadletter',
                type: 'direct',
                options: { durable: true },
              },
              // Custom exchanges from options
              ...(options?.exchanges || []).map((exchange) => ({
                name: exchange.name,
                type: exchange.type,
                options: { durable: true },
              })),
            ],
            uri: configService.get<string>(
              'RABBITMQ_URI',
              'amqp://localhost:5672',
            ),
            connectionInitOptions: {
              wait: false,
              timeout: 30000,
              reject: true,
            },
            enableControllerDiscovery: true,
            connectionManagerOptions: {
              heartbeatIntervalInSeconds: 15,
              reconnectTimeInSeconds: 30,
            },
            prefetchCount: configService.get<number>(
              'RABBITMQ_PREFETCH_COUNT',
              10,
            ),
            defaultRpcTimeout: configService.get<number>(
              'RABBITMQ_RPC_TIMEOUT',
              30000,
            ),
            defaultExchangeType: 'topic',
          }),
        }),
      ],
      providers: [RabbitMQService],
      exports: [RabbitMQService, NestRabbitMQModule],
    };
  }
}
