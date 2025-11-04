/**
 * Order Management Constants
 * Centralized configuration for validation, caching, and business rules
 */

import { OrderStatus, PaymentStatus, ShippingStatus } from '../enum/order.enum';

/**
 * Order Validation Rules
 */
export const ORDER_VALIDATION = {
  ORDER_NUMBER: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 50,
    PATTERN: /^ORD-\d{8}-\d{4}$/, // Format: ORD-YYYYMMDD-0001
  },
  NOTES: {
    MAX_LENGTH: 2000,
  },
  TRACKING_NUMBER: {
    MIN_LENGTH: 5,
    MAX_LENGTH: 100,
  },
  CUSTOMER_NOTES: {
    MAX_LENGTH: 1000,
  },
  ADMIN_NOTES: {
    MAX_LENGTH: 2000,
  },
  CANCELLATION_REASON: {
    MAX_LENGTH: 500,
  },
  RETURN_REASON: {
    MAX_LENGTH: 500,
  },
  AMOUNTS: {
    MIN: 0,
    MAX: 1000000,
    DECIMAL_PLACES: 2,
  },
  QUANTITY: {
    MIN: 1,
    MAX: 1000,
  },
  TAX_RATE: {
    MIN: 0,
    MAX: 100, // percentage
  },
  DISCOUNT: {
    MIN_PERCENTAGE: 0,
    MAX_PERCENTAGE: 100,
    MIN_AMOUNT: 0,
    MAX_AMOUNT: 100000,
  },
};

/**
 * Order Number Generation Config
 */
export const ORDER_NUMBER_CONFIG = {
  PREFIX: 'ORD',
  DATE_FORMAT: 'YYYYMMDD',
  SEQUENCE_LENGTH: 4,
  SEPARATOR: '-',
  // Example: ORD-20251104-0001
};

/**
 * Order Status Transitions
 * Defines valid status changes to prevent illegal transitions
 */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [
    OrderStatus.CONFIRMED,
    OrderStatus.PROCESSING,
    OrderStatus.CANCELLED,
    OrderStatus.FAILED,
  ],
  [OrderStatus.CONFIRMED]: [
    OrderStatus.PROCESSING,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.PROCESSING]: [
    OrderStatus.PACKED,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.PACKED]: [
    OrderStatus.SHIPPED,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.SHIPPED]: [
    OrderStatus.OUT_FOR_DELIVERY,
    OrderStatus.DELIVERED,
    OrderStatus.RETURNED,
  ],
  [OrderStatus.OUT_FOR_DELIVERY]: [
    OrderStatus.DELIVERED,
    OrderStatus.RETURNED,
    OrderStatus.FAILED,
  ],
  [OrderStatus.DELIVERED]: [
    OrderStatus.RETURNED,
  ],
  [OrderStatus.CANCELLED]: [], // Terminal state
  [OrderStatus.RETURNED]: [
    OrderStatus.REFUNDED,
  ],
  [OrderStatus.REFUNDED]: [], // Terminal state
  [OrderStatus.FAILED]: [], // Terminal state
};

/**
 * Payment Status Transitions
 */
export const PAYMENT_STATUS_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  [PaymentStatus.PENDING]: [
    PaymentStatus.PROCESSING,
    PaymentStatus.AUTHORIZED,
    PaymentStatus.PAID,
    PaymentStatus.FAILED,
    PaymentStatus.CANCELLED,
  ],
  [PaymentStatus.PROCESSING]: [
    PaymentStatus.AUTHORIZED,
    PaymentStatus.PAID,
    PaymentStatus.FAILED,
    PaymentStatus.CANCELLED,
  ],
  [PaymentStatus.AUTHORIZED]: [
    PaymentStatus.PAID,
    PaymentStatus.EXPIRED,
    PaymentStatus.CANCELLED,
  ],
  [PaymentStatus.PAID]: [
    PaymentStatus.REFUNDED,
    PaymentStatus.PARTIALLY_REFUNDED,
  ],
  [PaymentStatus.FAILED]: [], // Terminal state
  [PaymentStatus.REFUNDED]: [], // Terminal state
  [PaymentStatus.PARTIALLY_REFUNDED]: [
    PaymentStatus.REFUNDED,
  ],
  [PaymentStatus.CANCELLED]: [], // Terminal state
  [PaymentStatus.EXPIRED]: [], // Terminal state
};

/**
 * Shipping Status Transitions
 */
export const SHIPPING_STATUS_TRANSITIONS: Record<ShippingStatus, ShippingStatus[]> = {
  [ShippingStatus.NOT_SHIPPED]: [
    ShippingStatus.PREPARING,
  ],
  [ShippingStatus.PREPARING]: [
    ShippingStatus.READY_TO_SHIP,
  ],
  [ShippingStatus.READY_TO_SHIP]: [
    ShippingStatus.SHIPPED,
  ],
  [ShippingStatus.SHIPPED]: [
    ShippingStatus.IN_TRANSIT,
  ],
  [ShippingStatus.IN_TRANSIT]: [
    ShippingStatus.OUT_FOR_DELIVERY,
    ShippingStatus.FAILED_DELIVERY,
  ],
  [ShippingStatus.OUT_FOR_DELIVERY]: [
    ShippingStatus.DELIVERED,
    ShippingStatus.FAILED_DELIVERY,
  ],
  [ShippingStatus.DELIVERED]: [], // Terminal state
  [ShippingStatus.FAILED_DELIVERY]: [
    ShippingStatus.OUT_FOR_DELIVERY,
    ShippingStatus.RETURNED,
  ],
  [ShippingStatus.RETURNED]: [], // Terminal state
};

/**
 * Cache Configuration
 */
export const ORDER_CACHE_TTL = {
  SINGLE_ORDER: 1800,              // 30 minutes
  ORDER_LIST: 600,                 // 10 minutes
  CUSTOMER_ORDERS: 900,            // 15 minutes
  ORDER_STATS: 1800,               // 30 minutes
  REVENUE_REPORT: 3600,            // 1 hour
  TOP_CUSTOMERS: 3600,             // 1 hour
  RECENT_ORDERS: 300,              // 5 minutes
  ORDER_COUNT: 600,                // 10 minutes
  PENDING_ORDERS: 300,             // 5 minutes (needs frequent updates)
  ORDER_ANALYTICS: 1800,           // 30 minutes
};

/**
 * Cache Keys
 */
export const ORDER_CACHE_KEYS = {
  SINGLE: 'order',                     // order:{id}
  LIST: 'orders:list',                 // orders:list:{filters}
  CUSTOMER_ORDERS: 'orders:customer',  // orders:customer:{customerId}
  STATS: 'orders:stats',               // orders:stats:{period}
  REVENUE: 'orders:revenue',           // orders:revenue:{period}
  TOP_CUSTOMERS: 'orders:top-customers', // orders:top-customers:{limit}
  RECENT: 'orders:recent',             // orders:recent:{limit}
  COUNT: 'orders:count',               // orders:count:{status}
  PENDING: 'orders:pending',           // orders:pending
  ANALYTICS: 'orders:analytics',       // orders:analytics:{type}
  SEARCH: 'orders:search',             // orders:search:{query}
};

/**
 * Business Rules
 */
export const ORDER_BUSINESS_RULES = {
  // Order cancellation rules
  CANCELLATION: {
    ALLOWED_STATUSES: [
      OrderStatus.PENDING,
      OrderStatus.CONFIRMED,
      OrderStatus.PROCESSING,
      OrderStatus.PACKED,
    ],
    NOT_ALLOWED_STATUSES: [
      OrderStatus.SHIPPED,
      OrderStatus.OUT_FOR_DELIVERY,
      OrderStatus.DELIVERED,
      OrderStatus.CANCELLED,
      OrderStatus.RETURNED,
      OrderStatus.REFUNDED,
    ],
    TIME_LIMIT_HOURS: 24, // Can cancel within 24 hours
  },

  // Return rules
  RETURN: {
    ALLOWED_STATUSES: [OrderStatus.DELIVERED],
    TIME_LIMIT_DAYS: 30, // 30 days return policy
    MIN_DAYS_AFTER_DELIVERY: 0,
    MAX_DAYS_AFTER_DELIVERY: 30,
  },

  // Refund rules
  REFUND: {
    FULL_REFUND_STATUSES: [OrderStatus.CANCELLED],
    PARTIAL_REFUND_STATUSES: [OrderStatus.RETURNED],
    PROCESSING_TIME_DAYS: 7, // 7 business days
  },

  // Auto-status updates
  AUTO_STATUS: {
    PENDING_TO_FAILED_HOURS: 48, // Auto-fail if pending for 48 hours
    PAID_TO_PROCESSING_MINUTES: 5, // Auto-process after payment confirmation
    DELIVERED_TO_COMPLETED_DAYS: 7, // Auto-complete after 7 days of delivery
  },

  // Inventory
  INVENTORY: {
    RESERVE_ON_CHECKOUT: true,
    RELEASE_ON_CANCEL: true,
    DEDUCT_ON_PAYMENT: false, // Already deducted on order creation
  },

  // Minimum/Maximum order values
  ORDER_VALUE: {
    MIN_ORDER_VALUE: 10, // Minimum order $10
    MAX_ORDER_VALUE: 100000, // Maximum order $100,000
    FREE_SHIPPING_THRESHOLD: 50, // Free shipping over $50
  },

  // Tax
  TAX: {
    DEFAULT_RATE: 0, // 0% default (calculate based on location)
    APPLY_TO_SHIPPING: false,
  },

  // Shipping
  SHIPPING: {
    STANDARD_COST: 5,
    EXPRESS_COST: 15,
    OVERNIGHT_COST: 25,
    SAME_DAY_COST: 30,
    INTERNATIONAL_BASE_COST: 50,
  },
};

/**
 * Error Messages
 */
export const ORDER_MESSAGES = {
  // Success messages
  SUCCESS: {
    CREATED: 'Order created successfully',
    UPDATED: 'Order updated successfully',
    CANCELLED: 'Order cancelled successfully',
    CONFIRMED: 'Order confirmed successfully',
    SHIPPED: 'Order shipped successfully',
    DELIVERED: 'Order delivered successfully',
    REFUNDED: 'Order refunded successfully',
    PAYMENT_SUCCESS: 'Payment processed successfully',
  },

  // Error messages
  ERROR: {
    NOT_FOUND: 'Order not found',
    ALREADY_CANCELLED: 'Order is already cancelled',
    CANNOT_CANCEL: 'Order cannot be cancelled in current status',
    CANNOT_UPDATE: 'Order cannot be updated in current status',
    INVALID_STATUS_TRANSITION: 'Invalid status transition',
    INSUFFICIENT_STOCK: 'Insufficient stock for one or more items',
    PAYMENT_FAILED: 'Payment processing failed',
    INVALID_COUPON: 'Invalid or expired coupon',
    MINIMUM_ORDER_VALUE: 'Order does not meet minimum order value',
    MAXIMUM_ORDER_VALUE: 'Order exceeds maximum order value',
    INVALID_ADDRESS: 'Invalid shipping or billing address',
    CUSTOMER_NOT_FOUND: 'Customer not found',
    PRODUCT_NOT_FOUND: 'One or more products not found',
    EMPTY_CART: 'Cart is empty',
    RETURN_PERIOD_EXPIRED: 'Return period has expired',
    ALREADY_RETURNED: 'Order is already returned',
    CANNOT_RETURN: 'Order cannot be returned',
    REFUND_FAILED: 'Refund processing failed',
  },

  // Validation messages
  VALIDATION: {
    INVALID_ORDER_NUMBER: 'Invalid order number format',
    INVALID_QUANTITY: 'Invalid quantity',
    INVALID_AMOUNT: 'Invalid amount',
    INVALID_STATUS: 'Invalid order status',
    INVALID_PAYMENT_METHOD: 'Invalid payment method',
    MISSING_REQUIRED_FIELD: 'Required field is missing',
  },
};

/**
 * Order Status Display Labels
 */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'Pending Payment',
  [OrderStatus.CONFIRMED]: 'Confirmed',
  [OrderStatus.PROCESSING]: 'Processing',
  [OrderStatus.PACKED]: 'Packed',
  [OrderStatus.SHIPPED]: 'Shipped',
  [OrderStatus.OUT_FOR_DELIVERY]: 'Out for Delivery',
  [OrderStatus.DELIVERED]: 'Delivered',
  [OrderStatus.CANCELLED]: 'Cancelled',
  [OrderStatus.RETURNED]: 'Returned',
  [OrderStatus.REFUNDED]: 'Refunded',
  [OrderStatus.FAILED]: 'Failed',
};

/**
 * Payment Status Display Labels
 */
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: 'Payment Pending',
  [PaymentStatus.PROCESSING]: 'Processing Payment',
  [PaymentStatus.AUTHORIZED]: 'Payment Authorized',
  [PaymentStatus.PAID]: 'Paid',
  [PaymentStatus.FAILED]: 'Payment Failed',
  [PaymentStatus.REFUNDED]: 'Refunded',
  [PaymentStatus.PARTIALLY_REFUNDED]: 'Partially Refunded',
  [PaymentStatus.CANCELLED]: 'Payment Cancelled',
  [PaymentStatus.EXPIRED]: 'Payment Expired',
};

/**
 * Notification Triggers
 */
export const ORDER_NOTIFICATION_EVENTS = {
  ORDER_CREATED: 'order.created',
  ORDER_CONFIRMED: 'order.confirmed',
  ORDER_CANCELLED: 'order.cancelled',
  ORDER_SHIPPED: 'order.shipped',
  ORDER_DELIVERED: 'order.delivered',
  ORDER_RETURNED: 'order.returned',
  PAYMENT_SUCCESS: 'order.payment.success',
  PAYMENT_FAILED: 'order.payment.failed',
  REFUND_PROCESSED: 'order.refund.processed',
  STATUS_CHANGED: 'order.status.changed',
};

/**
 * Analytics Periods
 */
export const ANALYTICS_PERIODS = {
  TODAY: 'today',
  YESTERDAY: 'yesterday',
  THIS_WEEK: 'this_week',
  LAST_WEEK: 'last_week',
  THIS_MONTH: 'this_month',
  LAST_MONTH: 'last_month',
  THIS_QUARTER: 'this_quarter',
  LAST_QUARTER: 'last_quarter',
  THIS_YEAR: 'this_year',
  LAST_YEAR: 'last_year',
  CUSTOM: 'custom',
};

/**
 * Export Formats
 */
export const ORDER_EXPORT_FORMATS = {
  CSV: 'csv',
  EXCEL: 'excel',
  PDF: 'pdf',
  JSON: 'json',
};

/**
 * Default Pagination
 */
export const ORDER_PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};
