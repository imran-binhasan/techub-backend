import { CacheDomain } from '../enum/cache.enum';

/**
 * Default TTL configurations for different cache domains (in seconds)
 */
export const CACHE_TTL_CONFIG: Record<CacheDomain, number> = {
  [CacheDomain.PERMISSIONS]: 900, // 15 minutes
  [CacheDomain.USERS]: 1800, // 30 minutes
  [CacheDomain.PRODUCTS]: 3600, // 1 hour
  [CacheDomain.CATEGORIES]: 7200, // 2 hours
  [CacheDomain.SESSIONS]: 86400, // 24 hours
  [CacheDomain.CART]: 604800, // 7 days
  [CacheDomain.INVENTORY]: 300, // 5 minutes (frequently changing)
  [CacheDomain.PRICING]: 1800, // 30 minutes (price updates)
  [CacheDomain.ORDERS]: 3600, // 1 hour
  [CacheDomain.SETTINGS]: 14400, // 4 hours
  [CacheDomain.BRANDS]: 7200, // 2 hours
  [CacheDomain.COUPONS]: 1800, // 30 minutes
  [CacheDomain.REVIEWS]: 3600, // 1 hour
  [CacheDomain.WISHLIST]: 86400, // 24 hours
};

/**
 * Cache key prefixes for different domains
 */
export const CACHE_PREFIX_CONFIG: Record<CacheDomain, string> = {
  [CacheDomain.PERMISSIONS]: 'perm',
  [CacheDomain.USERS]: 'user',
  [CacheDomain.PRODUCTS]: 'prod',
  [CacheDomain.CATEGORIES]: 'cat',
  [CacheDomain.SESSIONS]: 'sess',
  [CacheDomain.CART]: 'cart',
  [CacheDomain.INVENTORY]: 'inv',
  [CacheDomain.PRICING]: 'price',
  [CacheDomain.ORDERS]: 'order',
  [CacheDomain.SETTINGS]: 'set',
  [CacheDomain.BRANDS]: 'brand',
  [CacheDomain.COUPONS]: 'coupon',
  [CacheDomain.REVIEWS]: 'review',
  [CacheDomain.WISHLIST]: 'wish',
};

/**
 * Maximum cache entry size (in bytes)
 * Prevent storing extremely large objects
 */
export const MAX_CACHE_ENTRY_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Maximum number of keys to fetch in bulk operations
 */
export const MAX_BULK_KEYS = 1000;

/**
 * Cache warming interval (in milliseconds)
 */
export const CACHE_WARMING_INTERVAL = 60000; // 1 minute

/**
 * Statistics cleanup interval (in milliseconds)
 */
export const STATS_CLEANUP_INTERVAL = 3600000; // 1 hour

/**
 * Default cache configuration
 */
export const DEFAULT_CACHE_CONFIG = {
  ttl: 3600, // 1 hour
  maxSize: MAX_CACHE_ENTRY_SIZE,
  serialize: true,
  compress: false,
};

/**
 * Cache error messages
 */
export const CACHE_ERROR_MESSAGES = {
  KEY_TOO_LONG: 'Cache key exceeds maximum length',
  VALUE_TOO_LARGE: 'Cache value exceeds maximum size',
  INVALID_DOMAIN: 'Invalid cache domain specified',
  OPERATION_FAILED: 'Cache operation failed',
  CONNECTION_ERROR: 'Cache connection error',
  SERIALIZATION_ERROR: 'Failed to serialize cache value',
  DESERIALIZATION_ERROR: 'Failed to deserialize cache value',
};
