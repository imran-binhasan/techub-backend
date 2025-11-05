import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  IsUUID,
  Min,
  Max,
  IsNotEmpty,
  IsObject,
  IsEnum,
  Length,
  IsIP,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  ShippingStatus,
  ShippingMethod,
  ReturnStatus,
  OrderPriority,
  OrderSource,
  OrderType,
  Currency,
} from '../enum/order.enum';

export class OrderItemDto {
  @ApiProperty({
    description: 'Product ID',
    example: 1,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  productId: number;

  @ApiProperty({
    description: 'Quantity to order',
    example: 2,
    minimum: 1,
    maximum: 1000,
  })
  @IsNumber()
  @Min(1)
  @Max(1000)
  @Type(() => Number)
  quantity: number;

  @ApiPropertyOptional({
    description: 'Selected product attributes (size, color, etc.)',
    example: { size: 'L', color: 'Blue' },
  })
  @IsOptional()
  @IsObject()
  selectedAttributes?: Record<string, any>;
}

export class CreateOrderDto {
  @ApiProperty({
    description: 'Customer ID who is placing the order',
    example: 1,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  customerId: number;

  @ApiProperty({
    description: 'Array of order items',
    type: [OrderItemDto],
    example: [
      {
        productId: 1,
        quantity: 2,
        selectedAttributes: { size: 'L', color: 'Blue' },
      },
      { productId: 2, quantity: 1 },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({
    description: 'Billing address ID',
    example: 1,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  billingAddressId: number;

  @ApiPropertyOptional({
    description: 'Shipping address ID (if different from billing)',
    example: 2,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  shippingAddressId?: number;

  @ApiPropertyOptional({
    description: 'Coupon/discount code ID to apply',
    example: 1,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  couponId?: number;

  @ApiPropertyOptional({
    description: 'Payment method for the order',
    enum: PaymentMethod,
    example: PaymentMethod.CREDIT_CARD,
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({
    description: 'Shipping method',
    enum: ShippingMethod,
    example: ShippingMethod.STANDARD,
    default: ShippingMethod.STANDARD,
  })
  @IsOptional()
  @IsEnum(ShippingMethod)
  shippingMethod?: ShippingMethod;

  @ApiPropertyOptional({
    description: 'Order priority level',
    enum: OrderPriority,
    example: OrderPriority.NORMAL,
    default: OrderPriority.NORMAL,
  })
  @IsOptional()
  @IsEnum(OrderPriority)
  priority?: OrderPriority;

  @ApiPropertyOptional({
    description: 'Order source/channel',
    enum: OrderSource,
    example: OrderSource.WEB,
    default: OrderSource.WEB,
  })
  @IsOptional()
  @IsEnum(OrderSource)
  orderSource?: OrderSource;

  @ApiPropertyOptional({
    description: 'Order type',
    enum: OrderType,
    example: OrderType.STANDARD,
    default: OrderType.STANDARD,
  })
  @IsOptional()
  @IsEnum(OrderType)
  orderType?: OrderType;

  @ApiPropertyOptional({
    description: 'Currency code (ISO 4217)',
    enum: Currency,
    example: Currency.USD,
    default: Currency.USD,
  })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @ApiPropertyOptional({
    description: 'Locale for the order (language and region)',
    example: 'en-US',
    default: 'en-US',
  })
  @IsOptional()
  @IsString()
  @Length(2, 10)
  locale?: string;

  @ApiPropertyOptional({
    description: 'Customer notes or special instructions',
    example: 'Please gift wrap this order',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  customerNotes?: string;

  @ApiPropertyOptional({
    description: 'General order notes',
    example: 'Customer requested express delivery',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({
    description: 'Tax amount (calculated)',
    example: 5.5,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  taxAmount?: number;

  @ApiPropertyOptional({
    description: 'Tax rate percentage',
    example: 10.5,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(100)
  taxRate?: number;

  @ApiPropertyOptional({
    description: 'Shipping cost',
    example: 10.0,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  shippingCost?: number;

  @ApiPropertyOptional({
    description: 'Customer IP address (for fraud detection)',
    example: '192.168.1.1',
  })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({
    description: 'User agent (browser/device info)',
    example: 'Mozilla/5.0...',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  userAgent?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: { referrer: 'google', campaign: 'summer_sale' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Clear customer cart after order creation',
    example: true,
    default: true,
  })
  @IsOptional()
  clearCart?: boolean;
}

export class OrderItemResponse {
  @ApiProperty({ description: 'Order item ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Product ID', example: 1 })
  productId: number;

  @ApiProperty({
    description: 'Product name at time of order',
    example: 'Premium Headphones',
  })
  productName: string;

  @ApiPropertyOptional({ description: 'Product SKU', example: 'HDPH-001' })
  productSku?: string;

  @ApiPropertyOptional({
    description: 'Product image URL',
    example: 'https://...',
  })
  productImage?: string;

  @ApiProperty({ description: 'Quantity ordered', example: 2 })
  quantity: number;

  @ApiProperty({ description: 'Unit price at time of order', example: 99.99 })
  unitPrice: number;

  @ApiProperty({ description: 'Total price for this item', example: 199.98 })
  totalPrice: number;

  @ApiPropertyOptional({
    description: 'Selected product attributes',
    example: { size: 'L', color: 'Blue' },
  })
  productAttributes?: Record<string, any>;
}

export class CustomerSummary {
  @ApiProperty({ description: 'Customer ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'First name', example: 'John' })
  firstName: string;

  @ApiProperty({ description: 'Last name', example: 'Doe' })
  lastName: string;

  @ApiProperty({ description: 'Email address', example: 'john@example.com' })
  email: string;
}

export class OrderResponse {
  @ApiProperty({ description: 'Order ID', example: 1 })
  id: number;

  @ApiProperty({
    description: 'Unique order number',
    example: 'ORD-20251104-0001',
  })
  orderNumber: string;

  @ApiProperty({ description: 'Customer ID', example: 1 })
  customerId: number;

  @ApiPropertyOptional({
    description: 'Customer summary',
    type: CustomerSummary,
  })
  customer?: CustomerSummary;

  // Amounts
  @ApiProperty({ description: 'Subtotal amount', example: 199.98 })
  subtotal: number;

  @ApiProperty({ description: 'Tax amount', example: 20.0 })
  taxAmount: number;

  @ApiProperty({ description: 'Shipping amount', example: 10.0 })
  shippingAmount: number;

  @ApiProperty({ description: 'Discount amount', example: 0.0 })
  discountAmount: number;

  @ApiProperty({ description: 'Total order amount', example: 229.98 })
  totalAmount: number;

  @ApiProperty({ description: 'Currency code', example: 'USD', enum: Currency })
  currency: Currency;

  // Status fields
  @ApiProperty({
    description: 'Order status',
    example: OrderStatus.PROCESSING,
    enum: OrderStatus,
  })
  status: OrderStatus;

  @ApiProperty({
    description: 'Payment status',
    example: PaymentStatus.PAID,
    enum: PaymentStatus,
  })
  paymentStatus: PaymentStatus;

  @ApiPropertyOptional({
    description: 'Payment method',
    example: PaymentMethod.CREDIT_CARD,
    enum: PaymentMethod,
  })
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({
    description: 'Payment transaction ID',
    example: 'pi_1234567890',
  })
  paymentTransactionId?: string;

  @ApiPropertyOptional({
    description: 'Shipping status',
    example: ShippingStatus.SHIPPED,
    enum: ShippingStatus,
  })
  shippingStatus?: ShippingStatus;

  @ApiPropertyOptional({
    description: 'Shipping method',
    example: ShippingMethod.STANDARD,
    enum: ShippingMethod,
  })
  shippingMethod?: ShippingMethod;

  @ApiPropertyOptional({
    description: 'Tracking number',
    example: 'DHL1234567890',
  })
  trackingNumber?: string;

  @ApiPropertyOptional({ description: 'Shipping carrier', example: 'DHL' })
  shippingCarrier?: string;

  @ApiPropertyOptional({
    description: 'Return status',
    example: ReturnStatus.NOT_REQUESTED,
    enum: ReturnStatus,
  })
  returnStatus?: ReturnStatus;

  @ApiProperty({
    description: 'Order priority',
    example: OrderPriority.NORMAL,
    enum: OrderPriority,
  })
  priority: OrderPriority;

  @ApiProperty({
    description: 'Order source',
    example: OrderSource.WEB,
    enum: OrderSource,
  })
  orderSource: OrderSource;

  @ApiProperty({
    description: 'Order type',
    example: OrderType.STANDARD,
    enum: OrderType,
  })
  orderType: OrderType;

  // Dates
  @ApiProperty({
    description: 'Order creation date',
    example: '2025-11-04T10:30:00Z',
  })
  orderDate: Date;

  @ApiPropertyOptional({
    description: 'Order confirmed date',
    example: '2025-11-04T10:35:00Z',
  })
  confirmedAt?: Date;

  @ApiPropertyOptional({ description: 'Order packed date' })
  packedAt?: Date;

  @ApiPropertyOptional({
    description: 'Order shipped date',
    example: '2025-11-05T09:00:00Z',
  })
  shippedAt?: Date;

  @ApiPropertyOptional({
    description: 'Order delivered date',
    example: '2025-11-07T14:30:00Z',
  })
  deliveredAt?: Date;

  @ApiPropertyOptional({ description: 'Order cancelled date' })
  cancelledAt?: Date;

  @ApiPropertyOptional({ description: 'Estimated delivery date' })
  estimatedDeliveryDate?: Date;

  // Notes
  @ApiPropertyOptional({ description: 'General order notes' })
  notes?: string;

  @ApiPropertyOptional({ description: 'Customer notes' })
  customerNotes?: string;

  @ApiPropertyOptional({ description: 'Admin notes (internal)' })
  adminNotes?: string;

  // Relations
  @ApiPropertyOptional({ description: 'Coupon details' })
  coupon?: any;

  @ApiPropertyOptional({ description: 'Shipping address' })
  shippingAddress?: any;

  @ApiPropertyOptional({ description: 'Billing address' })
  billingAddress?: any;

  @ApiProperty({ description: 'Order items', type: [OrderItemResponse] })
  orderItems: OrderItemResponse[];

  // Analytics
  @ApiProperty({ description: 'Number of items in order', example: 2 })
  itemCount: number;

  @ApiPropertyOptional({
    description: 'Processing time in minutes',
    example: 45,
  })
  processingTimeMinutes?: number;

  @ApiPropertyOptional({ description: 'Delivery time in hours', example: 48 })
  deliveryTimeHours?: number;

  // Timestamps
  @ApiProperty({ description: 'Created at', example: '2025-11-04T10:30:00Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at', example: '2025-11-04T10:35:00Z' })
  updatedAt: Date;
}
