import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  IsUUID,
  Min,
  IsNotEmpty,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @IsNumber()
  @IsNotEmpty()
  productId: number;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity: number;

  @IsOptional()
  @IsObject()
  selectedAttributes?: Record<string, any>; // For product variants like size, color
}

export class CreateOrderDto {
  @IsNumber()
  @IsNotEmpty()
  customerId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsNumber()
  @IsNotEmpty()
  billingAddressId: number;

  @IsOptional()
  @IsNumber()
  shippingAddressId?: number;

  @IsOptional()
  @IsNumber()
  couponId?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  taxAmount?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  shippingCost?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  clearCart?: boolean;
}

export class OrderItemResponse {
  id: number;
  productId: number;
  productName: string;
  productSku?: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  productAttributes?: Record<string, any>;
}

export class OrderResponse {
  id: number;
  orderNumber: string;
  customerId: number;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  paymentTransactionId?: string;
  orderDate: Date;
  confirmedAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  notes?: string;
  trackingNumber?: string;
  customer?: any;
  coupon?: any;
  shippingAddress?: any;
  billingAddress?: any;
  orderItems: OrderItemResponse[];
}
