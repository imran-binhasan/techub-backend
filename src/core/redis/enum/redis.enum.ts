/**
 * Redis connection states
 */
export enum RedisConnectionState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  READY = 'ready',
  DISCONNECTING = 'disconnecting',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error',
}

/**
 * Redis operation types
 */
export enum RedisOperationType {
  GET = 'get',
  SET = 'set',
  DEL = 'del',
  HGET = 'hget',
  HSET = 'hset',
  LPUSH = 'lpush',
  RPOP = 'rpop',
  SADD = 'sadd',
  SMEMBERS = 'smembers',
  EXPIRE = 'expire',
  TTL = 'ttl',
  EXISTS = 'exists',
  KEYS = 'keys',
  PIPELINE = 'pipeline',
  TRANSACTION = 'transaction',
}

/**
 * Redis data types
 */
export enum RedisDataType {
  STRING = 'string',
  HASH = 'hash',
  LIST = 'list',
  SET = 'set',
  SORTED_SET = 'zset',
  STREAM = 'stream',
}

/**
 * Lock status
 */
export enum LockStatus {
  ACQUIRED = 'acquired',
  FAILED = 'failed',
  RELEASED = 'released',
  EXPIRED = 'expired',
}
