import { QueueType, MessagePriority } from '../enum/rabbitmq.enum';

/**
 * Queue configurations
 */
export const QUEUE_CONFIG = {
  [QueueType.EMAIL]: {
    name: 'email.queue',
    durable: true,
    maxRetries: 3,
    retryDelay: 5000,
    priority: MessagePriority.NORMAL,
  },
  [QueueType.SMS]: {
    name: 'sms.queue',
    durable: true,
    maxRetries: 3,
    retryDelay: 5000,
    priority: MessagePriority.HIGH,
  },
  [QueueType.NOTIFICATION]: {
    name: 'notification.queue',
    durable: true,
    maxRetries: 5,
    retryDelay: 3000,
    priority: MessagePriority.NORMAL,
  },
  [QueueType.ORDER]: {
    name: 'order.queue',
    durable: true,
    maxRetries: 5,
    retryDelay: 10000,
    priority: MessagePriority.HIGH,
  },
  [QueueType.PAYMENT]: {
    name: 'payment.queue',
    durable: true,
    maxRetries: 5,
    retryDelay: 5000,
    priority: MessagePriority.URGENT,
  },
  [QueueType.INVENTORY]: {
    name: 'inventory.queue',
    durable: true,
    maxRetries: 3,
    retryDelay: 2000,
    priority: MessagePriority.HIGH,
  },
  [QueueType.EXPORT]: {
    name: 'export.queue',
    durable: true,
    maxRetries: 2,
    retryDelay: 30000,
    priority: MessagePriority.LOW,
  },
  [QueueType.IMPORT]: {
    name: 'import.queue',
    durable: true,
    maxRetries: 2,
    retryDelay: 30000,
    priority: MessagePriority.LOW,
  },
  [QueueType.ANALYTICS]: {
    name: 'analytics.queue',
    durable: false,
    maxRetries: 1,
    retryDelay: 60000,
    priority: MessagePriority.LOW,
  },
  [QueueType.WEBHOOK]: {
    name: 'webhook.queue',
    durable: true,
    maxRetries: 5,
    retryDelay: 10000,
    priority: MessagePriority.NORMAL,
  },
};

/**
 * Exchange configurations
 */
export const EXCHANGE_CONFIG = {
  main: {
    name: 'techub.main',
    type: 'topic',
    durable: true,
  },
  deadLetter: {
    name: 'techub.dlx',
    type: 'topic',
    durable: true,
  },
  delayed: {
    name: 'techub.delayed',
    type: 'x-delayed-message',
    durable: true,
  },
};

/**
 * Routing keys for different events
 */
export const ROUTING_KEYS = {
  // User events
  userCreated: 'user.created',
  userUpdated: 'user.updated',
  userDeleted: 'user.deleted',

  // Order events
  orderCreated: 'order.created',
  orderUpdated: 'order.updated',
  orderCancelled: 'order.cancelled',
  orderCompleted: 'order.completed',

  // Payment events
  paymentProcessed: 'payment.processed',
  paymentFailed: 'payment.failed',
  paymentRefunded: 'payment.refunded',

  // Inventory events
  inventoryUpdated: 'inventory.updated',
  inventoryLow: 'inventory.low',
  inventoryOut: 'inventory.out',

  // Notification events
  emailSend: 'notification.email',
  smsSend: 'notification.sms',
  pushSend: 'notification.push',
};

/**
 * Dead Letter Queue configuration
 */
export const DLQ_CONFIG = {
  exchangeName: 'techub.dlx',
  queueName: 'dead.letter.queue',
  routingKey: 'dlx.#',
  ttl: 86400000, // 24 hours
  maxLength: 10000,
};

/**
 * Message TTL (in milliseconds)
 */
export const MESSAGE_TTL = {
  short: 60000, // 1 minute
  medium: 300000, // 5 minutes
  long: 1800000, // 30 minutes
  veryLong: 3600000, // 1 hour
};

/**
 * Connection configuration
 */
export const CONNECTION_CONFIG = {
  heartbeat: 60,
  connectionTimeout: 10000,
  channelMax: 100,
  frameMax: 0,
  prefetchCount: 10,
};

/**
 * RabbitMQ error messages
 */
export const RABBITMQ_ERROR_MESSAGES = {
  CONNECTION_FAILED: 'Failed to connect to RabbitMQ',
  CHANNEL_ERROR: 'RabbitMQ channel error',
  PUBLISH_FAILED: 'Failed to publish message',
  CONSUME_FAILED: 'Failed to consume message',
  QUEUE_CREATION_FAILED: 'Failed to create queue',
  EXCHANGE_CREATION_FAILED: 'Failed to create exchange',
  BINDING_FAILED: 'Failed to bind queue to exchange',
  ACK_FAILED: 'Failed to acknowledge message',
  NACK_FAILED: 'Failed to reject message',
  MAX_RETRIES_EXCEEDED: 'Maximum retry attempts exceeded',
  INVALID_MESSAGE: 'Invalid message format',
  SERIALIZATION_ERROR: 'Failed to serialize message',
  DESERIALIZATION_ERROR: 'Failed to deserialize message',
};
