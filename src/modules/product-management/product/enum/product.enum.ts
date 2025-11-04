/**
 * Product Status Enum
 * Defines the lifecycle status of a product
 */
export enum ProductStatus {
  DRAFT = 'draft', // Product is being created, not visible to customers
  ACTIVE = 'active', // Product is live and available for purchase
  INACTIVE = 'inactive', // Product is temporarily disabled
  OUT_OF_STOCK = 'out_of_stock', // Product has no stock available
  DISCONTINUED = 'discontinued', // Product is permanently discontinued
}

/**
 * Product Condition Enum
 * Defines the physical condition of the product
 */
export enum ProductCondition {
  NEW = 'new', // Brand new product
  USED = 'used', // Pre-owned product in good condition
  REFURBISHED = 'refurbished', // Professionally restored product
  LIKE_NEW = 'like_new', // Minimal use, almost new
  DAMAGED = 'damaged', // Product with visible damage/defects
}

/**
 * Product Visibility Enum
 * Controls who can see the product
 */
export enum ProductVisibility {
  PUBLIC = 'public', // Visible to all customers
  PRIVATE = 'private', // Only visible to admins/vendors
  HIDDEN = 'hidden', // Hidden from listings but accessible via direct link
  MEMBERS_ONLY = 'members_only', // Only visible to registered members
}

/**
 * Product Sort Field Enum
 * Available fields for sorting products
 */
export enum ProductSortField {
  NAME = 'name',
  PRICE = 'price',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  RATING = 'avgRating',
  POPULARITY = 'viewCount',
  SALES = 'salesCount',
  STOCK = 'stock',
}

/**
 * Product Sort Order Enum
 */
export enum ProductSortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

/**
 * Discount Type Enum
 * Defines how discount is calculated
 */
export enum DiscountType {
  NONE = 'none',
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
}
