// src/rabbitmq/service/rabbitmq.service.ts
import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface MessageOptions {
  priority?: number;
  expiration?: string | number;
  persistent?: boolean;
  delay?: number;
  retryCount?: number;
  maxRetries?: number;
}

export interface ScheduledMessage {
  exchange: string;
  routingKey: string;
  message: any;
  delay: number;
  options?: MessageOptions;
}

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private scheduledMessages = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly amqpConnection: AmqpConnection,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async onModuleInit() {
    try {
      // Setup default queues
      await this.setupDefaultQueues();
      this.logger.log('✅ RabbitMQ service initialized successfully');
    } catch (error) {
      this.logger.error('❌ Failed to initialize RabbitMQ service:', error);
    }
  }

  async onModuleDestroy() {
    // Clear scheduled messages
    for (const timeout of this.scheduledMessages.values()) {
      clearTimeout(timeout);
    }
    this.scheduledMessages.clear();
    this.logger.log('🔄 RabbitMQ service destroyed');
  }

  private async setupDefaultQueues() {
    const queues = [
      // User events
      {
        name: 'user.registration',
        exchange: 'ecommerce.events',
        routingKey: 'user.registered',
      },
      {
        name: 'user.profile.updated',
        exchange: 'ecommerce.events',
        routingKey: 'user.profile.updated',
      },

      // Order events
      {
        name: 'order.created',
        exchange: 'ecommerce.orders',
        routingKey: 'order.created',
      },
      {
        name: 'order.confirmed',
        exchange: 'ecommerce.orders',
        routingKey: 'order.confirmed',
      },
      {
        name: 'order.shipped',
        exchange: 'ecommerce.orders',
        routingKey: 'order.shipped',
      },
      {
        name: 'order.delivered',
        exchange: 'ecommerce.orders',
        routingKey: 'order.delivered',
      },
      {
        name: 'order.cancelled',
        exchange: 'ecommerce.orders',
        routingKey: 'order.cancelled',
      },

      // Payment events
      {
        name: 'payment.pending',
        exchange: 'ecommerce.payments',
        routingKey: 'payment.pending',
      },
      {
        name: 'payment.completed',
        exchange: 'ecommerce.payments',
        routingKey: 'payment.completed',
      },
      {
        name: 'payment.failed',
        exchange: 'ecommerce.payments',
        routingKey: 'payment.failed',
      },
      {
        name: 'payment.refunded',
        exchange: 'ecommerce.payments',
        routingKey: 'payment.refunded',
      },

      // Inventory events
      {
        name: 'inventory.updated',
        exchange: 'ecommerce.inventory',
        routingKey: 'inventory.updated',
      },
      {
        name: 'inventory.low.stock',
        exchange: 'ecommerce.inventory',
        routingKey: 'inventory.low.stock',
      },
      {
        name: 'inventory.out.of.stock',
        exchange: 'ecommerce.inventory',
        routingKey: 'inventory.out.of.stock',
      },

      // Notification queues
      {
        name: 'notifications.email',
        exchange: 'ecommerce.notifications',
        routingKey: 'email',
      },
      {
        name: 'notifications.sms',
        exchange: 'ecommerce.notifications',
        routingKey: 'sms',
      },
      {
        name: 'notifications.push',
        exchange: 'ecommerce.notifications',
        routingKey: 'push',
      },

      // Dead letter queue
      {
        name: 'deadletter.queue',
        exchange: 'ecommerce.deadletter',
        routingKey: 'deadletter',
      },
    ];

    for (const queue of queues) {
      try {
        await this.amqpConnection.channel.assertQueue(queue.name, {
          durable: true,
          arguments: {
            'x-dead-letter-exchange': 'ecommerce.deadletter',
            'x-dead-letter-routing-key': 'deadletter',
            'x-message-ttl': 86400000, // 24 hours
          },
        });

        await this.amqpConnection.channel.bindQueue(
          queue.name,
          queue.exchange,
          queue.routingKey,
        );
      } catch (error) {
        this.logger.error(`Failed to setup queue ${queue.name}:`, error);
      }
    }
  }

  // Publish message to exchange
  async publish<T = any>(
    exchange: string,
    routingKey: string,
    message: T,
    options?: MessageOptions,
  ): Promise<boolean> {
    try {
      const publishOptions = {
        priority: options?.priority || 0,
        expiration: options?.expiration,
        persistent: options?.persistent !== false,
        headers: {
          'x-retry-count': options?.retryCount || 0,
          'x-max-retries': options?.maxRetries || 3,
          'x-published-at': new Date().toISOString(),
        },
      };

      await this.amqpConnection.publish(
        exchange,
        routingKey,
        message,
        publishOptions,
      );

      this.logger.debug(`📤 Message published to ${exchange}/${routingKey}`);
      return true;
    } catch (error) {
      this.logger.error(
        `❌ Failed to publish message to ${exchange}/${routingKey}:`,
        error,
      );
      return false;
    }
  }

  // Schedule message for future delivery
  async scheduleMessage<T = any>(
    exchange: string,
    routingKey: string,
    message: T,
    delay: number, // milliseconds
    options?: MessageOptions,
  ): Promise<string> {
    const messageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const timeout = setTimeout(async () => {
      await this.publish(exchange, routingKey, message, options);
      this.scheduledMessages.delete(messageId);
    }, delay);

    this.scheduledMessages.set(messageId, timeout);

    this.logger.debug(
      `⏰ Message scheduled for ${new Date(Date.now() + delay).toISOString()}`,
    );
    return messageId;
  }

  // Cancel scheduled message
  async cancelScheduledMessage(messageId: string): Promise<boolean> {
    const timeout = this.scheduledMessages.get(messageId);
    if (timeout) {
      clearTimeout(timeout);
      this.scheduledMessages.delete(messageId);
      return true;
    }
    return false;
  }

  // Publish event (emit to EventEmitter as well)
  async publishEvent<T = any>(
    eventName: string,
    payload: T,
    routingKey?: string,
    options?: MessageOptions,
  ): Promise<void> {
    // Emit locally first
    this.eventEmitter.emit(eventName, payload);

    // Then publish to RabbitMQ
    await this.publish(
      'ecommerce.events',
      routingKey || eventName,
      { event: eventName, payload, timestamp: new Date().toISOString() },
      options,
    );
  }

  // User events
  async publishUserEvent(event: string, userId: number, data: any) {
    return this.publishEvent(
      `user.${event}`,
      { userId, ...data },
      `user.${event}`,
    );
  }

  // Order events
  async publishOrderEvent(event: string, orderId: number, data: any) {
    return this.publish('ecommerce.orders', `order.${event}`, {
      orderId,
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  // Payment events
  async publishPaymentEvent(event: string, paymentId: number, data: any) {
    return this.publish('ecommerce.payments', `payment.${event}`, {
      paymentId,
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  // Inventory events
  async publishInventoryEvent(event: string, productId: number, data: any) {
    return this.publish('ecommerce.inventory', `inventory.${event}`, {
      productId,
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  // Notification methods
  async sendEmailNotification(to: string, template: string, data: any) {
    return this.publish('ecommerce.notifications', 'email', {
      to,
      template,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  async sendSMSNotification(to: string, message: string, data?: any) {
    return this.publish('ecommerce.notifications', 'sms', {
      to,
      message,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  async sendPushNotification(
    userId: number,
    title: string,
    body: string,
    data?: any,
  ) {
    return this.publish('ecommerce.notifications', 'push', {
      userId,
      title,
      body,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  // Bulk operations
  async publishBatch<T = any>(
    exchange: string,
    messages: Array<{
      routingKey: string;
      message: T;
      options?: MessageOptions;
    }>,
  ): Promise<boolean[]> {
    const results: boolean[] = [];

    for (const { routingKey, message, options } of messages) {
      const result = await this.publish(exchange, routingKey, message, options);
      results.push(result);
    }

    return results;
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      return this.amqpConnection.managedConnection.isConnected();
    } catch (error) {
      this.logger.error('RabbitMQ health check failed:', error);
      return false;
    }
  }

  // Get channel for advanced operations
  getChannel() {
    return this.amqpConnection.channel;
  }

  // Get connection for advanced operations
  getConnection() {
    return this.amqpConnection.managedConnection;
  }
}
