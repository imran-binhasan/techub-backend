/**
 * Order Management Utilities
 * Helper functions for order processing
 */

import { BadRequestException } from '@nestjs/common';
import {
  OrderStatus,
  PaymentStatus,
  ShippingStatus,
  ReturnStatus,
} from '../enum/order.enum';
import {
  ORDER_NUMBER_CONFIG,
  ORDER_STATUS_TRANSITIONS,
  PAYMENT_STATUS_TRANSITIONS,
  SHIPPING_STATUS_TRANSITIONS,
  ORDER_BUSINESS_RULES,
  ORDER_VALIDATION,
} from '../constants/order.constants';

/**
 * Generate unique order number
 * Format: ORD-YYYYMMDD-0001
 */
export function generateOrderNumber(sequenceNumber: number): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  const dateString = `${year}${month}${day}`;
  const sequence = String(sequenceNumber).padStart(ORDER_NUMBER_CONFIG.SEQUENCE_LENGTH, '0');
  
  return `${ORDER_NUMBER_CONFIG.PREFIX}${ORDER_NUMBER_CONFIG.SEPARATOR}${dateString}${ORDER_NUMBER_CONFIG.SEPARATOR}${sequence}`;
}

/**
 * Validate order number format
 */
export function isValidOrderNumber(orderNumber: string): boolean {
  return ORDER_VALIDATION.ORDER_NUMBER.PATTERN.test(orderNumber);
}

/**
 * Calculate order subtotal from items
 */
export function calculateSubtotal(items: Array<{ unitPrice: number; quantity: number }>): number {
  return items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
}

/**
 * Calculate tax amount
 */
export function calculateTax(
  subtotal: number,
  taxRate: number,
  includeShipping: boolean = false,
  shippingAmount: number = 0,
): number {
  const taxableAmount = includeShipping ? subtotal + shippingAmount : subtotal;
  return Number((taxableAmount * (taxRate / 100)).toFixed(2));
}

/**
 * Calculate shipping cost based on method and location
 */
export function calculateShippingCost(
  shippingMethod: string,
  weight?: number,
  distance?: number,
  isInternational: boolean = false,
): number {
  const { SHIPPING } = ORDER_BUSINESS_RULES;
  
  let baseCost = 0;
  
  switch (shippingMethod.toLowerCase()) {
    case 'standard':
      baseCost = SHIPPING.STANDARD_COST;
      break;
    case 'express':
      baseCost = SHIPPING.EXPRESS_COST;
      break;
    case 'overnight':
      baseCost = SHIPPING.OVERNIGHT_COST;
      break;
    case 'same_day':
      baseCost = SHIPPING.SAME_DAY_COST;
      break;
    case 'international':
      baseCost = SHIPPING.INTERNATIONAL_BASE_COST;
      break;
    default:
      baseCost = SHIPPING.STANDARD_COST;
  }
  
  // Add weight-based cost (optional)
  if (weight && weight > 5) {
    baseCost += (weight - 5) * 2; // $2 per kg over 5kg
  }
  
  // International surcharge
  if (isInternational) {
    baseCost += SHIPPING.INTERNATIONAL_BASE_COST;
  }
  
  return Number(baseCost.toFixed(2));
}

/**
 * Calculate discount amount based on coupon
 */
export function calculateDiscount(
  subtotal: number,
  discountType: 'percentage' | 'fixed',
  discountValue: number,
  maxDiscount?: number,
): number {
  let discount = 0;
  
  if (discountType === 'percentage') {
    discount = (subtotal * discountValue) / 100;
    if (maxDiscount) {
      discount = Math.min(discount, maxDiscount);
    }
  } else if (discountType === 'fixed') {
    discount = Math.min(discountValue, subtotal);
  }
  
  return Number(discount.toFixed(2));
}

/**
 * Calculate total order amount
 */
export function calculateTotalAmount(
  subtotal: number,
  taxAmount: number = 0,
  shippingAmount: number = 0,
  discountAmount: number = 0,
): number {
  const total = subtotal + taxAmount + shippingAmount - discountAmount;
  return Number(Math.max(0, total).toFixed(2));
}

/**
 * Check if free shipping applies
 */
export function isFreeShippingEligible(subtotal: number): boolean {
  return subtotal >= ORDER_BUSINESS_RULES.ORDER_VALUE.FREE_SHIPPING_THRESHOLD;
}

/**
 * Validate order status transition
 */
export function isValidOrderStatusTransition(
  currentStatus: OrderStatus,
  newStatus: OrderStatus,
): boolean {
  const allowedTransitions = ORDER_STATUS_TRANSITIONS[currentStatus] || [];
  return allowedTransitions.includes(newStatus);
}

/**
 * Validate payment status transition
 */
export function isValidPaymentStatusTransition(
  currentStatus: PaymentStatus,
  newStatus: PaymentStatus,
): boolean {
  const allowedTransitions = PAYMENT_STATUS_TRANSITIONS[currentStatus] || [];
  return allowedTransitions.includes(newStatus);
}

/**
 * Validate shipping status transition
 */
export function isValidShippingStatusTransition(
  currentStatus: ShippingStatus,
  newStatus: ShippingStatus,
): boolean {
  const allowedTransitions = SHIPPING_STATUS_TRANSITIONS[currentStatus] || [];
  return allowedTransitions.includes(newStatus);
}

/**
 * Check if order can be cancelled
 */
export function canCancelOrder(
  orderStatus: OrderStatus,
  orderDate: Date,
): { canCancel: boolean; reason?: string } {
  const { CANCELLATION } = ORDER_BUSINESS_RULES;
  
  // Check status
  if (CANCELLATION.NOT_ALLOWED_STATUSES.includes(orderStatus)) {
    return {
      canCancel: false,
      reason: `Order cannot be cancelled when status is ${orderStatus}`,
    };
  }
  
  // Check time limit
  const hoursSinceOrder = (Date.now() - orderDate.getTime()) / (1000 * 60 * 60);
  if (hoursSinceOrder > CANCELLATION.TIME_LIMIT_HOURS) {
    return {
      canCancel: false,
      reason: `Order can only be cancelled within ${CANCELLATION.TIME_LIMIT_HOURS} hours`,
    };
  }
  
  return { canCancel: true };
}

/**
 * Check if order can be returned
 */
export function canReturnOrder(
  orderStatus: OrderStatus,
  deliveredDate: Date | null,
): { canReturn: boolean; reason?: string } {
  const { RETURN } = ORDER_BUSINESS_RULES;
  
  // Check status
  if (!RETURN.ALLOWED_STATUSES.includes(orderStatus)) {
    return {
      canReturn: false,
      reason: `Order can only be returned when status is ${RETURN.ALLOWED_STATUSES.join(', ')}`,
    };
  }
  
  // Check delivery date
  if (!deliveredDate) {
    return {
      canReturn: false,
      reason: 'Order has not been delivered yet',
    };
  }
  
  // Check return period
  const daysSinceDelivery = (Date.now() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceDelivery > RETURN.TIME_LIMIT_DAYS) {
    return {
      canReturn: false,
      reason: `Return period of ${RETURN.TIME_LIMIT_DAYS} days has expired`,
    };
  }
  
  return { canReturn: true };
}

/**
 * Check if order meets minimum value requirements
 */
export function validateMinimumOrderValue(totalAmount: number): void {
  const minValue = ORDER_BUSINESS_RULES.ORDER_VALUE.MIN_ORDER_VALUE;
  if (totalAmount < minValue) {
    throw new BadRequestException(
      `Order total must be at least $${minValue}`,
    );
  }
}

/**
 * Check if order exceeds maximum value
 */
export function validateMaximumOrderValue(totalAmount: number): void {
  const maxValue = ORDER_BUSINESS_RULES.ORDER_VALUE.MAX_ORDER_VALUE;
  if (totalAmount > maxValue) {
    throw new BadRequestException(
      `Order total cannot exceed $${maxValue}`,
    );
  }
}

/**
 * Calculate refund amount
 */
export function calculateRefundAmount(
  totalPaid: number,
  returnedItems: Array<{ totalPrice: number }>,
  shippingRefund: boolean = false,
  shippingAmount: number = 0,
): number {
  const itemsRefund = returnedItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const shipping = shippingRefund ? shippingAmount : 0;
  
  return Number(Math.min(itemsRefund + shipping, totalPaid).toFixed(2));
}

/**
 * Format price for display
 */
export function formatPrice(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

/**
 * Format order number for display
 */
export function formatOrderNumber(orderNumber: string): string {
  return orderNumber.replace(/-/g, ' ');
}

/**
 * Get estimated delivery date
 */
export function getEstimatedDeliveryDate(
  shippingMethod: string,
  orderDate: Date = new Date(),
): { min: Date; max: Date } {
  const minDays = {
    standard: 5,
    express: 2,
    overnight: 1,
    same_day: 0,
    international: 10,
  }[shippingMethod.toLowerCase()] || 5;
  
  const maxDays = {
    standard: 7,
    express: 3,
    overnight: 1,
    same_day: 0,
    international: 15,
  }[shippingMethod.toLowerCase()] || 7;
  
  const minDate = new Date(orderDate);
  minDate.setDate(minDate.getDate() + minDays);
  
  const maxDate = new Date(orderDate);
  maxDate.setDate(maxDate.getDate() + maxDays);
  
  return { min: minDate, max: maxDate };
}

/**
 * Check if order is overdue
 */
export function isOrderOverdue(
  orderStatus: OrderStatus,
  orderDate: Date,
  expectedDays: number = 7,
): boolean {
  if ([OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.REFUNDED].includes(orderStatus)) {
    return false;
  }
  
  const daysSinceOrder = (Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceOrder > expectedDays;
}

/**
 * Generate tracking URL (example)
 */
export function generateTrackingUrl(
  trackingNumber: string,
  carrier: string = 'DHL',
): string {
  const carrierUrls: Record<string, string> = {
    DHL: `https://www.dhl.com/tracking?trackingNumber=${trackingNumber}`,
    FEDEX: `https://www.fedex.com/tracking?trackingNumber=${trackingNumber}`,
    UPS: `https://www.ups.com/tracking?trackingNumber=${trackingNumber}`,
    USPS: `https://www.usps.com/tracking?trackingNumber=${trackingNumber}`,
  };
  
  return carrierUrls[carrier.toUpperCase()] || `#${trackingNumber}`;
}

/**
 * Calculate order processing time (in hours)
 */
export function calculateProcessingTime(
  orderDate: Date,
  shippedDate: Date | null,
): number | null {
  if (!shippedDate) return null;
  
  const hours = (shippedDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60);
  return Number(hours.toFixed(2));
}

/**
 * Calculate delivery time (in hours)
 */
export function calculateDeliveryTime(
  shippedDate: Date | null,
  deliveredDate: Date | null,
): number | null {
  if (!shippedDate || !deliveredDate) return null;
  
  const hours = (deliveredDate.getTime() - shippedDate.getTime()) / (1000 * 60 * 60);
  return Number(hours.toFixed(2));
}

/**
 * Sanitize order notes (remove sensitive data)
 */
export function sanitizeOrderNotes(notes: string): string {
  // Remove credit card numbers
  notes = notes.replace(/\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}/g, '****-****-****-****');
  
  // Remove CVV
  notes = notes.replace(/\bCVV:?\s*\d{3,4}\b/gi, 'CVV: ***');
  
  // Remove email addresses (optional)
  // notes = notes.replace(/[\w.-]+@[\w.-]+\.\w+/g, '***@***.***');
  
  return notes.trim();
}

/**
 * Validate quantity
 */
export function validateQuantity(quantity: number): void {
  const { MIN, MAX } = ORDER_VALIDATION.QUANTITY;
  
  if (quantity < MIN || quantity > MAX) {
    throw new BadRequestException(
      `Quantity must be between ${MIN} and ${MAX}`,
    );
  }
}

/**
 * Round to decimal places
 */
export function roundToDecimal(value: number, places: number = 2): number {
  return Number(value.toFixed(places));
}
