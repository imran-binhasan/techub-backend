import { HttpException, HttpStatus } from '@nestjs/common';
import { RABBITMQ_ERROR_MESSAGES } from '../constants/rabbitmq.constants';

/**
 * Base class for all RabbitMQ-related exceptions
 */
export class RabbitMQException extends HttpException {
  constructor(message: string, statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR) {
    super(message, statusCode);
  }
}

/**
 * Thrown when RabbitMQ connection fails
 */
export class RabbitMQConnectionException extends RabbitMQException {
  constructor(reason?: string) {
    super(
      `${RABBITMQ_ERROR_MESSAGES.CONNECTION_FAILED}${reason ? `: ${reason}` : ''}`,
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

/**
 * Thrown when RabbitMQ channel error occurs
 */
export class RabbitMQChannelException extends RabbitMQException {
  constructor(reason?: string) {
    super(
      `${RABBITMQ_ERROR_MESSAGES.CHANNEL_ERROR}${reason ? `: ${reason}` : ''}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

/**
 * Thrown when message publishing fails
 */
export class RabbitMQPublishException extends RabbitMQException {
  constructor(queue: string, reason?: string) {
    super(
      `${RABBITMQ_ERROR_MESSAGES.PUBLISH_FAILED} to ${queue}${reason ? `: ${reason}` : ''}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

/**
 * Thrown when message consumption fails
 */
export class RabbitMQConsumeException extends RabbitMQException {
  constructor(queue: string, reason?: string) {
    super(
      `${RABBITMQ_ERROR_MESSAGES.CONSUME_FAILED} from ${queue}${reason ? `: ${reason}` : ''}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

/**
 * Thrown when queue creation fails
 */
export class RabbitMQQueueCreationException extends RabbitMQException {
  constructor(queueName: string, reason?: string) {
    super(
      `${RABBITMQ_ERROR_MESSAGES.QUEUE_CREATION_FAILED}: ${queueName}${reason ? ` - ${reason}` : ''}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

/**
 * Thrown when exchange creation fails
 */
export class RabbitMQExchangeCreationException extends RabbitMQException {
  constructor(exchangeName: string, reason?: string) {
    super(
      `${RABBITMQ_ERROR_MESSAGES.EXCHANGE_CREATION_FAILED}: ${exchangeName}${reason ? ` - ${reason}` : ''}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

/**
 * Thrown when queue binding fails
 */
export class RabbitMQBindingException extends RabbitMQException {
  constructor(queue: string, exchange: string, reason?: string) {
    super(
      `${RABBITMQ_ERROR_MESSAGES.BINDING_FAILED}: ${queue} to ${exchange}${reason ? ` - ${reason}` : ''}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

/**
 * Thrown when message acknowledgement fails
 */
export class RabbitMQAckException extends RabbitMQException {
  constructor(reason?: string) {
    super(
      `${RABBITMQ_ERROR_MESSAGES.ACK_FAILED}${reason ? `: ${reason}` : ''}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

/**
 * Thrown when message rejection fails
 */
export class RabbitMQNackException extends RabbitMQException {
  constructor(reason?: string) {
    super(
      `${RABBITMQ_ERROR_MESSAGES.NACK_FAILED}${reason ? `: ${reason}` : ''}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

/**
 * Thrown when maximum retry attempts are exceeded
 */
export class RabbitMQMaxRetriesException extends RabbitMQException {
  constructor(messageId: string, retries: number) {
    super(
      `${RABBITMQ_ERROR_MESSAGES.MAX_RETRIES_EXCEEDED} for message ${messageId} (${retries} attempts)`,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}

/**
 * Thrown when message format is invalid
 */
export class RabbitMQInvalidMessageException extends RabbitMQException {
  constructor(reason?: string) {
    super(
      `${RABBITMQ_ERROR_MESSAGES.INVALID_MESSAGE}${reason ? `: ${reason}` : ''}`,
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * Thrown when message serialization fails
 */
export class RabbitMQSerializationException extends RabbitMQException {
  constructor(messageId: string) {
    super(
      `${RABBITMQ_ERROR_MESSAGES.SERIALIZATION_ERROR} for message: ${messageId}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

/**
 * Thrown when message deserialization fails
 */
export class RabbitMQDeserializationException extends RabbitMQException {
  constructor(messageId: string) {
    super(
      `${RABBITMQ_ERROR_MESSAGES.DESERIALIZATION_ERROR} for message: ${messageId}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
