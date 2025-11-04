/**
 * Order Management Enums
 * Centralized enum definitions for type safety and consistency
 */

/**
 * Order Status Lifecycle
 */
export enum OrderStatus {
  PENDING = 'pending',           // Order created, awaiting payment
  CONFIRMED = 'confirmed',       // Payment received, order confirmed
  PROCESSING = 'processing',     // Order being prepared
  PACKED = 'packed',            // Order packed, ready to ship
  SHIPPED = 'shipped',          // Order dispatched to customer
  OUT_FOR_DELIVERY = 'out_for_delivery', // Order out for delivery
  DELIVERED = 'delivered',      // Order delivered successfully
  CANCELLED = 'cancelled',      // Order cancelled (before shipping)
  RETURNED = 'returned',        // Order returned by customer
  REFUNDED = 'refunded',        // Payment refunded to customer
  FAILED = 'failed',            // Order processing failed
}

/**
 * Payment Status
 */
export enum PaymentStatus {
  PENDING = 'pending',           // Payment not yet initiated
  PROCESSING = 'processing',     // Payment being processed
  AUTHORIZED = 'authorized',     // Payment authorized (not captured)
  PAID = 'paid',                // Payment successful
  FAILED = 'failed',            // Payment failed
  REFUNDED = 'refunded',        // Payment refunded
  PARTIALLY_REFUNDED = 'partially_refunded', // Partial refund issued
  CANCELLED = 'cancelled',      // Payment cancelled
  EXPIRED = 'expired',          // Payment authorization expired
}

/**
 * Payment Method Types
 */
export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  PAYPAL = 'paypal',
  STRIPE = 'stripe',
  SSL_COMMERZ = 'ssl_commerz',
  BKASH = 'bkash',
  NAGAD = 'nagad',
  ROCKET = 'rocket',
  BANK_TRANSFER = 'bank_transfer',
  CASH_ON_DELIVERY = 'cash_on_delivery',
}

/**
 * Shipping Status
 */
export enum ShippingStatus {
  NOT_SHIPPED = 'not_shipped',
  PREPARING = 'preparing',
  READY_TO_SHIP = 'ready_to_ship',
  SHIPPED = 'shipped',
  IN_TRANSIT = 'in_transit',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  FAILED_DELIVERY = 'failed_delivery',
  RETURNED = 'returned',
}

/**
 * Shipping Method Types
 */
export enum ShippingMethod {
  STANDARD = 'standard',         // 5-7 business days
  EXPRESS = 'express',           // 2-3 business days
  OVERNIGHT = 'overnight',       // Next day delivery
  SAME_DAY = 'same_day',        // Same day delivery
  PICKUP = 'pickup',            // Customer pickup
  INTERNATIONAL = 'international', // International shipping
}

/**
 * Return/Refund Request Status
 */
export enum ReturnStatus {
  NOT_REQUESTED = 'not_requested',
  REQUESTED = 'requested',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PICKED_UP = 'picked_up',
  RECEIVED = 'received',
  INSPECTED = 'inspected',
  REFUNDED = 'refunded',
  COMPLETED = 'completed',
}

/**
 * Return Reason Types
 */
export enum ReturnReason {
  DEFECTIVE = 'defective',
  DAMAGED = 'damaged',
  WRONG_ITEM = 'wrong_item',
  NOT_AS_DESCRIBED = 'not_as_described',
  SIZE_ISSUE = 'size_issue',
  COLOR_DIFFERENCE = 'color_difference',
  QUALITY_ISSUE = 'quality_issue',
  CHANGED_MIND = 'changed_mind',
  ORDERED_BY_MISTAKE = 'ordered_by_mistake',
  BETTER_PRICE_AVAILABLE = 'better_price_available',
  OTHER = 'other',
}

/**
 * Order Cancellation Reason
 */
export enum CancellationReason {
  CUSTOMER_REQUEST = 'customer_request',
  PAYMENT_FAILED = 'payment_failed',
  OUT_OF_STOCK = 'out_of_stock',
  FRAUD_DETECTION = 'fraud_detection',
  DUPLICATE_ORDER = 'duplicate_order',
  PRICING_ERROR = 'pricing_error',
  ADDRESS_ISSUE = 'address_issue',
  VENDOR_UNAVAILABLE = 'vendor_unavailable',
  SYSTEM_ERROR = 'system_error',
  OTHER = 'other',
}

/**
 * Order Priority Levels
 */
export enum OrderPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

/**
 * Order Source/Channel
 */
export enum OrderSource {
  WEB = 'web',
  MOBILE_APP = 'mobile_app',
  ADMIN_PANEL = 'admin_panel',
  API = 'api',
  PHONE = 'phone',
  POS = 'pos',               // Point of Sale
  MARKETPLACE = 'marketplace', // Third-party marketplace
}

/**
 * Order Type
 */
export enum OrderType {
  STANDARD = 'standard',
  PRE_ORDER = 'pre_order',
  SUBSCRIPTION = 'subscription',
  WHOLESALE = 'wholesale',
  GIFT = 'gift',
  SAMPLE = 'sample',
}

/**
 * Currency Codes (ISO 4217)
 */
export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  BDT = 'BDT',
  INR = 'INR',
  AUD = 'AUD',
  CAD = 'CAD',
  JPY = 'JPY',
  CNY = 'CNY',
}

/**
 * Order Sort Fields
 */
export enum OrderSortField {
  ORDER_NUMBER = 'orderNumber',
  ORDER_DATE = 'orderDate',
  TOTAL_AMOUNT = 'totalAmount',
  STATUS = 'status',
  PAYMENT_STATUS = 'paymentStatus',
  CUSTOMER_NAME = 'customer.firstName',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}

/**
 * Sort Order
 */
export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

/**
 * Fulfillment Status
 */
export enum FulfillmentStatus {
  UNFULFILLED = 'unfulfilled',
  PARTIALLY_FULFILLED = 'partially_fulfilled',
  FULFILLED = 'fulfilled',
  CANCELLED = 'cancelled',
}

/**
 * Invoice Status
 */
export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  VIEWED = 'viewed',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}
