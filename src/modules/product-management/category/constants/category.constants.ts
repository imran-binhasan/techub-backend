/**
 * Category Module Constants
 */

/**
 * Validation Rules
 */
export const CATEGORY_VALIDATION = {
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 255,
  },
  SLUG: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 255,
    PATTERN: /^[a-z0-9\-]+$/,
  },
  DESCRIPTION: {
    MAX_LENGTH: 1000,
  },
  SEO: {
    META_TITLE_MAX: 60,
    META_DESCRIPTION_MAX: 160,
  },
  DISPLAY_ORDER: {
    MIN: 0,
    MAX: 99999,
  },
} as const;

/**
 * Query Limits
 */
export const CATEGORY_QUERY_LIMITS = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 50,
  MIN_LIMIT: 1,
  MAX_LIMIT: 100,
  MAX_DEPTH: 5, // Maximum nesting depth
} as const;

/**
 * Cache Configuration (in seconds)
 */
export const CATEGORY_CACHE_TTL = {
  SINGLE_CATEGORY: 7200, // 2 hours
  CATEGORY_LIST: 3600, // 1 hour
  CATEGORY_TREE: 3600, // 1 hour
  ROOT_CATEGORIES: 7200, // 2 hours
  CATEGORY_COUNT: 3600, // 1 hour
} as const;

/**
 * Cache Keys
 */
export const CATEGORY_CACHE_KEYS = {
  SINGLE: (id: number) => `category:${id}`,
  BY_SLUG: (slug: string) => `category:slug:${slug}`,
  LIST: (filters: string) => `categories:list:${filters}`,
  TREE: () => `categories:tree`,
  ROOT: () => `categories:root`,
  CHILDREN: (parentId: number) => `categories:children:${parentId}`,
  COUNT: () => `categories:count`,
  WITH_PRODUCTS: (id: number) => `category:${id}:products`,
} as const;

/**
 * Default Values
 */
export const CATEGORY_DEFAULTS = {
  IS_VISIBLE: true,
  DISPLAY_ORDER: 0,
  PRODUCTS_COUNT: 0,
} as const;

/**
 * Error Messages
 */
export const CATEGORY_ERROR_MESSAGES = {
  NOT_FOUND: 'Category not found',
  ALREADY_EXISTS: 'Category with this name or slug already exists',
  INVALID_SLUG: 'Invalid slug format. Use lowercase letters, numbers, and dashes only',
  HAS_CHILDREN: 'Cannot delete category that has child categories',
  HAS_PRODUCTS: 'Cannot delete category that has associated products',
  CIRCULAR_DEPENDENCY: 'Circular dependency detected in category hierarchy',
  SELF_PARENT: 'Category cannot be its own parent',
  MAX_DEPTH_EXCEEDED: 'Maximum category nesting depth exceeded',
  PARENT_NOT_FOUND: 'Parent category not found',
  NAME_TOO_SHORT: `Category name must be at least ${CATEGORY_VALIDATION.NAME.MIN_LENGTH} characters`,
  NAME_TOO_LONG: `Category name cannot exceed ${CATEGORY_VALIDATION.NAME.MAX_LENGTH} characters`,
  DESCRIPTION_TOO_LONG: `Description cannot exceed ${CATEGORY_VALIDATION.DESCRIPTION.MAX_LENGTH} characters`,
} as const;

/**
 * Success Messages
 */
export const CATEGORY_SUCCESS_MESSAGES = {
  CREATED: 'Category created successfully',
  UPDATED: 'Category updated successfully',
  DELETED: 'Category deleted successfully',
  RESTORED: 'Category restored successfully',
  REORDERED: 'Categories reordered successfully',
} as const;

/**
 * Indexed Fields
 */
export const CATEGORY_INDEXED_FIELDS = [
  'slug',
  'isVisible',
  'displayOrder',
  'parentId',
] as const;

/**
 * Searchable Fields
 */
export const CATEGORY_SEARCHABLE_FIELDS = [
  'name',
  'description',
  'metaTitle',
  'metaDescription',
] as const;
