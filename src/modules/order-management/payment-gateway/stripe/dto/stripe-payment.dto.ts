import {
  IsString,
  IsNumber,
  IsEmail,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  Min,
  IsNotEmpty,
  IsBoolean,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum StripeCurrency {
  USD = 'usd',
  EUR = 'eur',
  GBP = 'gbp',
  CAD = 'cad',
  AUD = 'aud',
  JPY = 'jpy',
  BDT = 'bdt',
}

export enum StripePaymentMethodType {
  CARD = 'card',
  BANK_TRANSFER = 'customer_balance',
  WALLET = 'alipay',
}

export class StripeLineItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  unitAmount: number; // Amount in cents

  @IsOptional()
  @IsString()
  currency?: StripeCurrency;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}

export class StripeCustomerDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsObject()
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };

  @IsOptional()
  @IsObject()
  shipping?: {
    name?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
    };
  };
}

export class StripePaymentIntentDto {
  @IsNumber()
  @Min(50) // Minimum 50 cents
  @Type(() => Number)
  amount: number; // Amount in cents

  @IsEnum(StripeCurrency)
  currency: StripeCurrency;

  @IsNumber()
  @IsNotEmpty()
  orderId: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  customerId?: string; // Stripe customer ID

  @IsOptional()
  @ValidateNested()
  @Type(() => StripeCustomerDto)
  customer?: StripeCustomerDto;

  @IsOptional()
  @IsArray()
  @IsEnum(StripePaymentMethodType, { each: true })
  paymentMethodTypes?: StripePaymentMethodType[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;

  @IsOptional()
  @IsString()
  returnUrl?: string;

  @IsOptional()
  @IsBoolean()
  automaticPaymentMethods?: boolean;
}

export class StripeCheckoutSessionDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StripeLineItemDto)
  lineItems: StripeLineItemDto[];

  @IsEnum(StripeCurrency)
  currency: StripeCurrency;

  @IsNumber()
  @IsNotEmpty()
  orderId: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => StripeCustomerDto)
  customer?: StripeCustomerDto;

  @IsOptional()
  @IsString()
  customerId?: string; // Stripe customer ID

  @IsOptional()
  @IsString()
  successUrl?: string;

  @IsOptional()
  @IsString()
  cancelUrl?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;

  @IsOptional()
  @IsArray()
  @IsEnum(StripePaymentMethodType, { each: true })
  paymentMethodTypes?: StripePaymentMethodType[];

  @IsOptional()
  @IsBoolean()
  allowPromotionCodes?: boolean;

  @IsOptional()
  @IsString()
  mode?: 'payment' | 'setup' | 'subscription';
}

export class StripeRefundDto {
  @IsString()
  @IsNotEmpty()
  paymentIntentId: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  amount?: number; // Amount in cents, if not provided, full refund

  @IsOptional()
  @IsString()
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';

  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;
}

export class StripeWebhookDto {
  @IsString()
  @IsNotEmpty()
  eventType: string;

  @IsObject()
  data: any;

  @IsString()
  @IsNotEmpty()
  stripeSignature: string;
}
