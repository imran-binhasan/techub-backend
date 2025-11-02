import { HttpException, HttpStatus } from '@nestjs/common';
import { REDIS_ERROR_MESSAGES } from '../constants/redis.constants';

/**
 * Base class for all Redis-related exceptions
 */
export class RedisException extends HttpException {
  constructor(message: string, statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR) {
    super(message, statusCode);
  }
}

/**
 * Thrown when Redis connection fails
 */
export class RedisConnectionException extends RedisException {
  constructor(reason?: string) {
    super(
      `${REDIS_ERROR_MESSAGES.CONNECTION_FAILED}${reason ? `: ${reason}` : ''}`,
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

/**
 * Thrown when Redis operation fails
 */
export class RedisOperationException extends RedisException {
  constructor(operation: string, reason?: string) {
    super(
      `${REDIS_ERROR_MESSAGES.OPERATION_FAILED}: ${operation}${reason ? ` - ${reason}` : ''}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

/**
 * Thrown when Redis key exceeds maximum length
 */
export class RedisKeyTooLongException extends RedisException {
  constructor(keyLength: number, maxLength: number) {
    super(
      `${REDIS_ERROR_MESSAGES.KEY_TOO_LONG}. Length: ${keyLength}, Max: ${maxLength}`,
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * Thrown when Redis value exceeds maximum size
 */
export class RedisValueTooLargeException extends RedisException {
  constructor(valueSize: number, maxSize: number) {
    super(
      `${REDIS_ERROR_MESSAGES.VALUE_TOO_LARGE}. Size: ${Math.round(valueSize / 1024)}KB, Max: ${Math.round(maxSize / 1024)}KB`,
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * Thrown when lock acquisition fails
 */
export class RedisLockException extends RedisException {
  constructor(key: string, reason?: string) {
    super(
      `${REDIS_ERROR_MESSAGES.LOCK_FAILED} for key: ${key}${reason ? ` - ${reason}` : ''}`,
      HttpStatus.CONFLICT,
    );
  }
}

/**
 * Thrown when lock release fails
 */
export class RedisLockReleaseException extends RedisException {
  constructor(key: string, reason?: string) {
    super(
      `${REDIS_ERROR_MESSAGES.LOCK_RELEASE_FAILED} for key: ${key}${reason ? ` - ${reason}` : ''}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

/**
 * Thrown when serialization fails
 */
export class RedisSerializationException extends RedisException {
  constructor(key: string) {
    super(
      `${REDIS_ERROR_MESSAGES.SERIALIZATION_ERROR} for key: ${key}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

/**
 * Thrown when deserialization fails
 */
export class RedisDeserializationException extends RedisException {
  constructor(key: string) {
    super(
      `${REDIS_ERROR_MESSAGES.DESERIALIZATION_ERROR} for key: ${key}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

/**
 * Thrown when Redis operation times out
 */
export class RedisTimeoutException extends RedisException {
  constructor(operation: string, timeout: number) {
    super(
      `${REDIS_ERROR_MESSAGES.TIMEOUT}: ${operation} (${timeout}ms)`,
      HttpStatus.REQUEST_TIMEOUT,
    );
  }
}

/**
 * Thrown when invalid data type is used
 */
export class RedisInvalidDataTypeException extends RedisException {
  constructor(expected: string, received: string) {
    super(
      `${REDIS_ERROR_MESSAGES.INVALID_DATA_TYPE}. Expected: ${expected}, Received: ${received}`,
      HttpStatus.BAD_REQUEST,
    );
  }
}
