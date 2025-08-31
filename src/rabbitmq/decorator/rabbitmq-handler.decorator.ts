import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { applyDecorators } from '@nestjs/common';

import type { MessageErrorHandler } from '@golevelup/nestjs-rabbitmq';

export interface RabbitMQHandlerOptions {
  queue: string;
  exchange: string;
  routingKey: string | string[];
  errorHandler?: MessageErrorHandler;
  queueOptions?: {
    durable?: boolean;
    arguments?: Record<string, any>;
  };
}

export function RabbitMQHandler(options: RabbitMQHandlerOptions) {
  return applyDecorators(
    RabbitSubscribe({
      exchange: options.exchange,
      routingKey: options.routingKey,
      queue: options.queue,
      queueOptions: {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': 'ecommerce.deadletter',
          'x-dead-letter-routing-key': 'deadletter',
          ...options.queueOptions?.arguments,
        },
        ...options.queueOptions,
      },
      errorHandler: options.errorHandler,
    }),
  );
}