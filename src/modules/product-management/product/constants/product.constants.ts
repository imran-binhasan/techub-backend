/**
 * Product Module Constants
 * Centralized configuration for product-related operations
 */

/**
 * Validation Rules
 */
export const PRODUCT_VALIDATION = {
  NAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 255,
  },
  DESCRIPTION: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 5000,
  },
  SKU: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 100,
    PATTERN: /^[A-Z0-9\-_]+$/i, // Alphanumeric, dash, underscore
  },
  SLUG: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 255,
    PATTERN: /^[a-z0-9\-]+$/, // Lowercase alphanumeric with dashes
  },
  PRICE: {
    MIN: 0,
    MAX: 1000000,
    DECIMAL_PLACES: 2,
  },
  STOCK: {
    MIN: 0,
    MAX: 999999,
  },
  DISCOUNT: {
    PERCENTAGE: {
      MIN: 0,
      MAX: 100,
    },
    AMOUNT: {
      MIN: 0,
      MAX: 100000,
    },
  },
  SEO: {
    META_TITLE_MAX: 60,
    META_DESCRIPTION_MAX: 160,
    KEYWORDS_MAX: 10,
  },
  RATING: {
    MIN: 0,
    MAX: 5,
    DECIMAL_PLACES: 2,
  },
} as const;

/**
 * Stock Management
 */
export const STOCK_THRESHOLDS = {
  LOW_STOCK: 10,
  CRITICAL_STOCK: 5,
  OUT_OF_STOCK: 0,
  DEFAULT_STOCK: 0,
} as const;

/**
 * Query Limits
 */
export const PRODUCT_QUERY_LIMITS = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MIN_LIMIT: 1,
  MAX_LIMIT: 100,
  MAX_SEARCH_LENGTH: 255,
  MAX_BULK_OPERATIONS: 500,
} as const;

/**
 * Cache Configuration (in seconds)
 */
export const PRODUCT_CACHE_TTL = {
  SINGLE_PRODUCT: 3600, // 1 hour
  PRODUCT_LIST: 1800, // 30 minutes
  FEATURED_PRODUCTS: 1800, // 30 minutes
  POPULAR_PRODUCTS: 900, // 15 minutes
  RELATED_PRODUCTS: 1800, // 30 minutes
  PRODUCT_SEARCH: 600, // 10 minutes
  LOW_STOCK_PRODUCTS: 300, // 5 minutes
  PRODUCT_COUNT: 900, // 15 minutes
  PRODUCT_STATS: 1800, // 30 minutes
} as const;

/**
 * Cache Keys
 */
export const PRODUCT_CACHE_KEYS = {
  SINGLE: `product`,
  LIST: `products:list`,
  FEATURED: `products:featured`,
  POPULAR: `products:popular`,
  TRENDING: `products:trending`,
  RELATED: `products:related`,
  SEARCH: `products:search`,
  LOW_STOCK: `products:low-stock`,
  BY_CATEGORY: `products:category`,
  BY_BRAND: `products:brand`,
  BY_VENDOR: `products:vendor`,
  COUNT: `products:count`,
  STATS: `products:stats`,
} as const;

/**
 * Default Values
 */
export const PRODUCT_DEFAULTS = {
  STATUS: 'draft',
  CONDITION: 'new',
  VISIBILITY: 'public',
  IS_FEATURED: false,
  IS_PUBLISHED: false,
  STOCK: 0,
  DISCOUNT_TYPE: 'none',
  DISCOUNT_VALUE: 0,
  AVG_RATING: 0,
  REVIEW_COUNT: 0,
  VIEW_COUNT: 0,
  SALES_COUNT: 0,
} as const;

/**
 * Analytics Tracking
 */
export const PRODUCT_ANALYTICS = {
  TRENDING_PERIOD_DAYS: 7, // Consider last 7 days for trending
  POPULAR_MIN_VIEWS: 100, // Minimum views to be considered popular
  TOP_SELLING_LIMIT: 10,
  RECENTLY_VIEWED_LIMIT: 20,
  RELATED_PRODUCTS_LIMIT: 6,
} as const;

/**
 * Image Configuration
 */
export const PRODUCT_IMAGE = {
  MAX_IMAGES: 10,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_FORMATS: ['jpg', 'jpeg', 'png', 'webp'],
  THUMBNAIL_SIZE: { width: 200, height: 200 },
  MEDIUM_SIZE: { width: 600, height: 600 },
  LARGE_SIZE: { width: 1200, height: 1200 },
} as const;

/**
 * Error Messages
 */
export const PRODUCT_ERROR_MESSAGES = {
  NOT_FOUND: 'Product not found',
  ALREADY_EXISTS: 'Product with this name or SKU already exists',
  INVALID_SKU:
    'Invalid SKU format. Use alphanumeric characters, dashes, and underscores only',
  INVALID_SLUG:
    'Invalid slug format. Use lowercase letters, numbers, and dashes only',
  INSUFFICIENT_STOCK: 'Insufficient stock available',
  INVALID_PRICE: 'Product price must be greater than or equal to 0',
  INVALID_DISCOUNT: 'Invalid discount configuration',
  PRICE_TOO_LOW: 'Product price is too low',
  PRICE_TOO_HIGH: 'Product price exceeds maximum allowed',
  STOCK_NEGATIVE: 'Stock cannot be negative',
  STOCK_TOO_HIGH: 'Stock exceeds maximum allowed',
  NAME_TOO_SHORT: `Product name must be at least ${PRODUCT_VALIDATION.NAME.MIN_LENGTH} characters`,
  NAME_TOO_LONG: `Product name cannot exceed ${PRODUCT_VALIDATION.NAME.MAX_LENGTH} characters`,
  DESCRIPTION_TOO_SHORT: `Description must be at least ${PRODUCT_VALIDATION.DESCRIPTION.MIN_LENGTH} characters`,
  DESCRIPTION_TOO_LONG: `Description cannot exceed ${PRODUCT_VALIDATION.DESCRIPTION.MAX_LENGTH} characters`,
  IN_CART: 'Cannot delete product that is in customer carts',
  IN_ORDERS: 'Cannot delete product with existing orders',
  CATEGORY_REQUIRED: 'Category is required for published products',
  INVALID_STATUS_TRANSITION: 'Invalid status transition',
  VARIANT_NOT_FOUND: 'Product variant not found',
  ATTRIBUTE_NOT_FOUND: 'Product attribute not found',
  MAX_IMAGES_EXCEEDED: `Maximum ${PRODUCT_IMAGE.MAX_IMAGES} images allowed per product`,
  INVALID_IMAGE_FORMAT: `Allowed formats: ${PRODUCT_IMAGE.ALLOWED_FORMATS.join(', ')}`,
  IMAGE_TOO_LARGE: `Image size cannot exceed ${PRODUCT_IMAGE.MAX_FILE_SIZE / (1024 * 1024)}MB`,
} as const;

/**
 * Success Messages
 */
export const PRODUCT_SUCCESS_MESSAGES = {
  CREATED: 'Product created successfully',
  UPDATED: 'Product updated successfully',
  DELETED: 'Product deleted successfully',
  RESTORED: 'Product restored successfully',
  STATUS_CHANGED: 'Product status updated successfully',
  STOCK_UPDATED: 'Product stock updated successfully',
  PRICE_UPDATED: 'Product price updated successfully',
  PUBLISHED: 'Product published successfully',
  UNPUBLISHED: 'Product unpublished successfully',
  FEATURED: 'Product marked as featured',
  UNFEATURED: 'Product unmarked as featured',
  BULK_UPDATED: 'Products updated successfully',
  BULK_DELETED: 'Products deleted successfully',
} as const;

/**
 * Indexing Fields
 * Fields that should be indexed in the database
 */
export const PRODUCT_INDEXED_FIELDS = [
  'sku',
  'slug',
  'status',
  'categoryId',
  'brandId',
  'vendorId',
  'isFeatured',
  'isPublished',
  'avgRating',
  'viewCount',
  'salesCount',
  'createdAt',
] as const;

/**
 * Composite Indexes
 * For optimizing common queries
 */
export const PRODUCT_COMPOSITE_INDEXES = [
  ['status', 'isPublished'],
  ['categoryId', 'status'],
  ['brandId', 'status'],
  ['vendorId', 'status'],
  ['isFeatured', 'status'],
  ['avgRating', 'status'],
  ['price', 'status'],
  ['createdAt', 'status'],
] as const;

/**
 * Searchable Fields
 * Fields included in full-text search
 */
export const PRODUCT_SEARCHABLE_FIELDS = [
  'name',
  'description',
  'sku',
  'metaTitle',
  'metaDescription',
  'keywords',
] as const;

/**
 * Sortable Fields
 * Fields that can be used for sorting
 */
export const PRODUCT_SORTABLE_FIELDS = [
  'name',
  'price',
  'stock',
  'avgRating',
  'viewCount',
  'salesCount',
  'createdAt',
  'updatedAt',
] as const;
