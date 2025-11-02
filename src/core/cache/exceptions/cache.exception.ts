import { HttpException, HttpStatus } from '@nestjs/common';
import { CACHE_ERROR_MESSAGES } from '../constants/cache.constants';

/**
 * Base class for all cache-related exceptions
 */
export class CacheException extends HttpException {
  constructor(message: string, statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR) {
    super(message, statusCode);
  }
}

/**
 * Thrown when cache key exceeds maximum length
 */
export class CacheKeyTooLongException extends CacheException {
  constructor(keyLength: number, maxLength: number) {
    super(
      `${CACHE_ERROR_MESSAGES.KEY_TOO_LONG}. Key length: ${keyLength}, Max: ${maxLength}`,
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * Thrown when cache value exceeds maximum size
 */
export class CacheValueTooLargeException extends CacheException {
  constructor(valueSize: number, maxSize: number) {
    super(
      `${CACHE_ERROR_MESSAGES.VALUE_TOO_LARGE}. Size: ${Math.round(valueSize / 1024)}KB, Max: ${Math.round(maxSize / 1024)}KB`,
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * Thrown when invalid cache domain is specified
 */
export class InvalidCacheDomainException extends CacheException {
  constructor(domain: string) {
    super(
      `${CACHE_ERROR_MESSAGES.INVALID_DOMAIN}: ${domain}`,
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * Thrown when cache operation fails
 */
export class CacheOperationFailedException extends CacheException {
  constructor(operation: string, reason?: string) {
    super(
      `${CACHE_ERROR_MESSAGES.OPERATION_FAILED}: ${operation}${reason ? ` - ${reason}` : ''}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

/**
 * Thrown when cache connection error occurs
 */
export class CacheConnectionException extends CacheException {
  constructor(reason?: string) {
    super(
      `${CACHE_ERROR_MESSAGES.CONNECTION_ERROR}${reason ? `: ${reason}` : ''}`,
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

/**
 * Thrown when serialization fails
 */
export class CacheSerializationException extends CacheException {
  constructor(key: string) {
    super(
      `${CACHE_ERROR_MESSAGES.SERIALIZATION_ERROR} for key: ${key}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

/**
 * Thrown when deserialization fails
 */
export class CacheDeserializationException extends CacheException {
  constructor(key: string) {
    super(
      `${CACHE_ERROR_MESSAGES.DESERIALIZATION_ERROR} for key: ${key}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
