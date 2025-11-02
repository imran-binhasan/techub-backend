/**
 * Cache strategy types
 */
export enum CacheStrategy {
  WRITE_THROUGH = 'write_through',
  WRITE_BEHIND = 'write_behind',
  WRITE_AROUND = 'write_around',
  READ_THROUGH = 'read_through',
  CACHE_ASIDE = 'cache_aside',
}

/**
 * Cache domain types
 */
export enum CacheDomain {
  PERMISSIONS = 'permissions',
  USERS = 'users',
  PRODUCTS = 'products',
  CATEGORIES = 'categories',
  SESSIONS = 'sessions',
  CART = 'cart',
  INVENTORY = 'inventory',
  PRICING = 'pricing',
  ORDERS = 'orders',
  SETTINGS = 'settings',
  BRANDS = 'brands',
  COUPONS = 'coupons',
  REVIEWS = 'reviews',
  WISHLIST = 'wishlist',
}

/**
 * Cache invalidation strategy
 */
export enum InvalidationStrategy {
  TTL_BASED = 'ttl_based',
  EVENT_BASED = 'event_based',
  MANUAL = 'manual',
  TAG_BASED = 'tag_based',
}

/**
 * Cache priority levels
 */
export enum CachePriority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  CRITICAL = 4,
}
