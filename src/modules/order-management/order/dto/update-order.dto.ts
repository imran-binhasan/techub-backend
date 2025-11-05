import { PartialType } from '@nestjs/swagger';
import { CreateOrderDto } from './create-order.dto';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  ShippingStatus,
  ShippingMethod,
  ReturnStatus,
  ReturnReason,
  CancellationReason,
  OrderPriority,
} from '../enum/order.enum';

export class UpdateOrderDto extends PartialType(CreateOrderDto) {
  @ApiPropertyOptional({
    description: 'Order status',
    enum: OrderStatus,
    example: OrderStatus.PROCESSING,
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({
    description: 'Payment status',
    enum: PaymentStatus,
    example: PaymentStatus.PAID,
  })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({
    description: 'Payment method',
    enum: PaymentMethod,
    example: PaymentMethod.CREDIT_CARD,
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({
    description: 'Payment transaction ID from gateway',
    example: 'pi_1234567890',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  paymentTransactionId?: string;

  @ApiPropertyOptional({
    description: 'Shipping status',
    enum: ShippingStatus,
    example: ShippingStatus.SHIPPED,
  })
  @IsOptional()
  @IsEnum(ShippingStatus)
  shippingStatus?: ShippingStatus;

  @ApiPropertyOptional({
    description: 'Shipping method',
    enum: ShippingMethod,
    example: ShippingMethod.EXPRESS,
  })
  @IsOptional()
  @IsEnum(ShippingMethod)
  shippingMethod?: ShippingMethod;

  @ApiPropertyOptional({
    description: 'Tracking number for shipment',
    example: 'DHL1234567890',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  trackingNumber?: string;

  @ApiPropertyOptional({
    description: 'Shipping carrier name',
    example: 'DHL',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  shippingCarrier?: string;

  @ApiPropertyOptional({
    description: 'Return status',
    enum: ReturnStatus,
    example: ReturnStatus.APPROVED,
  })
  @IsOptional()
  @IsEnum(ReturnStatus)
  returnStatus?: ReturnStatus;

  @ApiPropertyOptional({
    description: 'Return reason',
    enum: ReturnReason,
    example: ReturnReason.DEFECTIVE,
  })
  @IsOptional()
  @IsEnum(ReturnReason)
  returnReason?: ReturnReason;

  @ApiPropertyOptional({
    description: 'Refund amount',
    example: 50.0,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  refundAmount?: number;

  @ApiPropertyOptional({
    description: 'Cancellation reason',
    enum: CancellationReason,
    example: CancellationReason.CUSTOMER_REQUEST,
  })
  @IsOptional()
  @IsEnum(CancellationReason)
  cancellationReason?: CancellationReason;

  @ApiPropertyOptional({
    description: 'Cancellation notes',
    example: 'Customer no longer needs the product',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  cancellationNotes?: string;

  @ApiPropertyOptional({
    description: 'Order priority',
    enum: OrderPriority,
    example: OrderPriority.HIGH,
  })
  @IsOptional()
  @IsEnum(OrderPriority)
  priority?: OrderPriority;

  @ApiPropertyOptional({
    description: 'Admin notes (internal use)',
    example: 'Customer requested expedited processing',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  adminNotes?: string;

  @ApiPropertyOptional({
    description: 'General order notes',
    example: 'Handle with care',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
