/**
 * Default Redis configuration
 */
export const REDIS_CONFIG = {
  // Connection settings
  maxRetriesPerRequest: 3,
  retryDelayMs: 100,
  connectionTimeout: 10000,
  keepAlive: 30000,
  
  // Pool settings
  minConnections: 5,
  maxConnections: 50,
  
  // Key settings
  keyPrefix: 'techub:',
  maxKeyLength: 512,
  
  // Value settings
  maxValueSize: 10 * 1024 * 1024, // 10MB
  
  // Operation settings
  commandTimeout: 5000,
  pipelineBatchSize: 100,
};

/**
 * Default TTL values (in seconds)
 */
export const REDIS_DEFAULT_TTL = {
  short: 300, // 5 minutes
  medium: 1800, // 30 minutes
  long: 3600, // 1 hour
  veryLong: 86400, // 24 hours
  permanent: 0, // No expiration
};

/**
 * Lock configuration
 */
export const REDIS_LOCK_CONFIG = {
  defaultTTL: 30, // 30 seconds
  maxTTL: 300, // 5 minutes
  retryDelayMs: 50,
  maxRetries: 10,
};

/**
 * Monitoring configuration
 */
export const REDIS_MONITORING_CONFIG = {
  metricsInterval: 60000, // 1 minute
  slowCommandThreshold: 100, // 100ms
  connectionCheckInterval: 30000, // 30 seconds
};

/**
 * Redis error messages
 */
export const REDIS_ERROR_MESSAGES = {
  CONNECTION_FAILED: 'Failed to connect to Redis',
  OPERATION_FAILED: 'Redis operation failed',
  KEY_TOO_LONG: 'Redis key exceeds maximum length',
  VALUE_TOO_LARGE: 'Redis value exceeds maximum size',
  LOCK_FAILED: 'Failed to acquire lock',
  LOCK_RELEASE_FAILED: 'Failed to release lock',
  SERIALIZATION_ERROR: 'Failed to serialize value',
  DESERIALIZATION_ERROR: 'Failed to deserialize value',
  TIMEOUT: 'Redis operation timeout',
  INVALID_DATA_TYPE: 'Invalid Redis data type',
};

/**
 * Common Redis key patterns
 */
export const REDIS_KEY_PATTERNS = {
  user: 'user:*',
  session: 'sess:*',
  cache: 'cache:*',
  lock: 'lock:*',
  queue: 'queue:*',
  rateLimit: 'ratelimit:*',
  temp: 'temp:*',
};
