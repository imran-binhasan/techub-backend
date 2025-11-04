/**
 * Cart Constants
 * Centralized configuration for cart management
 * Optimized for free Redis version with short TTLs
 */

/**
 * Validation rules for cart operations
 */
export const CART_VALIDATION = {
  QUANTITY: {
    MIN: 1,
    MAX: 99,
  },
  CART_SIZE: {
    MAX_ITEMS: 100, // Maximum items in cart
    MAX_QUANTITY_PER_ITEM: 99,
  },
  EXPIRY: {
    GUEST_CART_DAYS: 7, // Guest cart expires after 7 days
    CUSTOMER_CART_DAYS: 90, // Customer cart expires after 90 days
    SAVED_FOR_LATER_DAYS: 180, // Saved items expire after 180 days
  },
};

/**
 * Cache configuration - SHORT TTLs for free Redis
 * Cart data changes frequently, so we use minimal caching
 */
export const CART_CACHE_TTL = {
  CUSTOMER_CART: 300, // 5 minutes - cart items list
  CART_TOTAL: 300, // 5 minutes - cart total calculation
  CART_COUNT: 180, // 3 minutes - cart items count
  CART_ITEM: 300, // 5 minutes - single cart item
};

/**
 * Cache key patterns
 */
export const CART_CACHE_KEYS = {
  CUSTOMER_ITEMS: 'customer', // cart:customer:{customerId}
  TOTAL: 'total', // cart:total:{customerId}
  COUNT: 'count', // cart:count:{customerId}
  ITEM: 'item', // cart:item:{id}
};

/**
 * Business rules for cart operations
 */
export const CART_BUSINESS_RULES = {
  // Merge carts when guest converts to customer
  MERGE_ON_LOGIN: true,
  // Auto-remove items with zero stock
  AUTO_REMOVE_OUT_OF_STOCK: false,
  // Update price when product price changes
  DYNAMIC_PRICING: true,
  // Allow adding same product multiple times
  ALLOW_DUPLICATES: false,
  // Clear cart after order is placed
  CLEAR_AFTER_ORDER: false, // Keep for "buy again" feature
  // Maximum age before showing "price may have changed" warning
  PRICE_FRESHNESS_HOURS: 24,
};

/**
 * Success and error messages
 */
export const CART_MESSAGES = {
  SUCCESS: {
    ADDED: 'Item added to cart successfully',
    UPDATED: 'Cart updated successfully',
    REMOVED: 'Item removed from cart',
    CLEARED: 'Cart cleared successfully',
    MERGED: 'Carts merged successfully',
    SAVED_FOR_LATER: 'Item saved for later',
    MOVED_TO_CART: 'Item moved to cart',
    QUANTITY_UPDATED: 'Quantity updated successfully',
  },
  ERROR: {
    NOT_FOUND: 'Cart item not found',
    PRODUCT_NOT_FOUND: 'Product not found',
    CUSTOMER_NOT_FOUND: 'Customer not found',
    INSUFFICIENT_STOCK: 'Insufficient stock available',
    INVALID_QUANTITY: 'Invalid quantity. Must be between 1 and 99',
    MAX_ITEMS_EXCEEDED: 'Maximum cart items limit exceeded (100 items)',
    PRODUCT_UNAVAILABLE: 'Product is no longer available',
    CART_EXPIRED: 'Cart has expired',
    DUPLICATE_ITEM: 'Item already exists in cart',
  },
  WARNING: {
    PRICE_CHANGED: 'Product price has changed since you added it to cart',
    LOW_STOCK: 'Only {stock} items left in stock',
    CART_EXPIRING_SOON: 'Your cart will expire in {days} days',
    OUT_OF_STOCK: 'This item is currently out of stock',
  },
};

/**
 * Default pagination settings
 */
export const CART_PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

/**
 * Cart event names for RabbitMQ
 */
export const CART_EVENTS = {
  ITEM_ADDED: 'cart.item.added',
  ITEM_UPDATED: 'cart.item.updated',
  ITEM_REMOVED: 'cart.item.removed',
  CART_CLEARED: 'cart.cleared',
  CART_MERGED: 'cart.merged',
  CART_EXPIRED: 'cart.expired',
  SAVED_FOR_LATER: 'cart.saved_for_later',
};

/**
 * HTTP status codes
 */
export const CART_HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
};
