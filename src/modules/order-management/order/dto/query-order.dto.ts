import { IsOptional, IsString, IsEnum, IsDate, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  ShippingStatus,
  ReturnStatus,
  OrderPriority,
  OrderSource,
  OrderType,
  OrderSortField,
  SortOrder,
} from '../enum/order.enum';

export class QueryOrderDto {
  @ApiPropertyOptional({
    description: 'Filter by customer ID',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  customerId?: number;

  @ApiPropertyOptional({
    description: 'Filter by order status',
    enum: OrderStatus,
    example: OrderStatus.PROCESSING,
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({
    description: 'Filter by payment status',
    enum: PaymentStatus,
    example: PaymentStatus.PAID,
  })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({
    description: 'Filter by payment method',
    enum: PaymentMethod,
    example: PaymentMethod.CREDIT_CARD,
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({
    description: 'Filter by shipping status',
    enum: ShippingStatus,
    example: ShippingStatus.SHIPPED,
  })
  @IsOptional()
  @IsEnum(ShippingStatus)
  shippingStatus?: ShippingStatus;

  @ApiPropertyOptional({
    description: 'Filter by return status',
    enum: ReturnStatus,
    example: ReturnStatus.APPROVED,
  })
  @IsOptional()
  @IsEnum(ReturnStatus)
  returnStatus?: ReturnStatus;

  @ApiPropertyOptional({
    description: 'Filter by order priority',
    enum: OrderPriority,
    example: OrderPriority.HIGH,
  })
  @IsOptional()
  @IsEnum(OrderPriority)
  priority?: OrderPriority;

  @ApiPropertyOptional({
    description: 'Filter by order source',
    enum: OrderSource,
    example: OrderSource.WEB,
  })
  @IsOptional()
  @IsEnum(OrderSource)
  orderSource?: OrderSource;

  @ApiPropertyOptional({
    description: 'Filter by order type',
    enum: OrderType,
    example: OrderType.STANDARD,
  })
  @IsOptional()
  @IsEnum(OrderType)
  orderType?: OrderType;

  @ApiPropertyOptional({
    description: 'Filter orders from this date',
    example: '2025-01-01',
    type: Date,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  orderDateFrom?: Date;

  @ApiPropertyOptional({
    description: 'Filter orders up to this date',
    example: '2025-12-31',
    type: Date,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  orderDateTo?: Date;

  @ApiPropertyOptional({
    description: 'Minimum order total amount',
    example: 10,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  minTotal?: number;

  @ApiPropertyOptional({
    description: 'Maximum order total amount',
    example: 1000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  maxTotal?: number;

  @ApiPropertyOptional({
    description: 'Search by order number, customer name, email',
    example: 'ORD-20251104',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    enum: OrderSortField,
    example: OrderSortField.ORDER_DATE,
    default: OrderSortField.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(OrderSortField)
  sortBy?: OrderSortField = OrderSortField.CREATED_AT;

  @ApiPropertyOptional({
    description: 'Sort order (ascending or descending)',
    enum: SortOrder,
    example: SortOrder.DESC,
    default: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;
}
