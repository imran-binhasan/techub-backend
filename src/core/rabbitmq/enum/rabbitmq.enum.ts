/**
 * Queue types for different message categories
 */
export enum QueueType {
  EMAIL = 'email',
  SMS = 'sms',
  NOTIFICATION = 'notification',
  ORDER = 'order',
  PAYMENT = 'payment',
  INVENTORY = 'inventory',
  EXPORT = 'export',
  IMPORT = 'import',
  ANALYTICS = 'analytics',
  WEBHOOK = 'webhook',
}

/**
 * Exchange types
 */
export enum ExchangeType {
  DIRECT = 'direct',
  TOPIC = 'topic',
  FANOUT = 'fanout',
  HEADERS = 'headers',
}

/**
 * Message priority levels
 */
export enum MessagePriority {
  LOW = 1,
  NORMAL = 5,
  HIGH = 8,
  URGENT = 10,
}

/**
 * Message status
 */
export enum MessageStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  RETRYING = 'retrying',
  DEAD_LETTER = 'dead_letter',
}

/**
 * Delivery mode
 */
export enum DeliveryMode {
  NON_PERSISTENT = 1,
  PERSISTENT = 2,
}

/**
 * Consumer acknowledgement mode
 */
export enum AckMode {
  AUTO = 'auto',
  MANUAL = 'manual',
}
