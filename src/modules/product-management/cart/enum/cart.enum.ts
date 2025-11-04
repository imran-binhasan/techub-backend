/**
 * Cart Enums
 * Defines all enum types for cart management
 */

/**
 * Cart status enum
 * Tracks the lifecycle of cart items
 */
export enum CartStatus {
  ACTIVE = 'ACTIVE', // Active cart item
  SAVED_FOR_LATER = 'SAVED_FOR_LATER', // Saved for later purchase
  EXPIRED = 'EXPIRED', // Cart item expired (past expiry date)
  MERGED = 'MERGED', // Cart merged with another (e.g., guest to customer)
}

/**
 * Cart source enum
 * Tracks where the cart item was added from
 */
export enum CartSource {
  WEB = 'WEB', // Added from web browser
  MOBILE_APP = 'MOBILE_APP', // Added from mobile app
  MOBILE_WEB = 'MOBILE_WEB', // Added from mobile browser
  API = 'API', // Added via API
  ADMIN = 'ADMIN', // Added by admin
  IMPORT = 'IMPORT', // Imported from external source
}

/**
 * Cart sort fields
 */
export enum CartSortField {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  QUANTITY = 'quantity',
  PRODUCT_NAME = 'product.name',
  PRODUCT_PRICE = 'product.price',
}

/**
 * Sort order
 */
export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}
