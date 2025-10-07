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
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum PayPalCurrency {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  CAD = 'CAD',
  AUD = 'AUD',
  JPY = 'JPY',
  BDT = 'BDT',
}

export enum PayPalIntent {
  CAPTURE = 'CAPTURE',
  AUTHORIZE = 'AUTHORIZE',
}

export enum PayPalLandingPage {
  LOGIN = 'LOGIN',
  BILLING = 'BILLING',
  NO_PREFERENCE = 'NO_PREFERENCE',
}

export enum PayPalUserAction {
  CONTINUE = 'CONTINUE',
  PAY_NOW = 'PAY_NOW',
}

export class PayPalItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity: number;

  @IsString()
  @IsNotEmpty()
  unitAmount: string; // PayPal expects string format like "10.00"

  @IsEnum(PayPalCurrency)
  currency: PayPalCurrency;

  @IsOptional()
  @IsString()
  category?: 'PHYSICAL_GOODS' | 'DIGITAL_GOODS' | 'DONATION';
}

export class PayPalAddressDto {
  @IsOptional()
  @IsString()
  addressLine1?: string;

  @IsOptional()
  @IsString()
  addressLine2?: string;

  @IsOptional()
  @IsString()
  adminArea1?: string; // state/province

  @IsOptional()
  @IsString()
  adminArea2?: string; // city

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsString()
  countryCode?: string; // ISO 3166-1 alpha-2 country code
}

export class PayPalPayerDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  givenName?: string;

  @IsOptional()
  @IsString()
  surname?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PayPalAddressDto)
  address?: PayPalAddressDto;
}

export class PayPalShippingDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ValidateNested()
  @Type(() => PayPalAddressDto)
  address: PayPalAddressDto;
}

export class PayPalOrderDto {
  @IsEnum(PayPalIntent)
  intent: PayPalIntent;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PayPalItemDto)
  items: PayPalItemDto[];

  @IsNumber()
  @IsNotEmpty()
  orderId: number;

  @IsString()
  @IsNotEmpty()
  totalAmount: string; // PayPal expects string format

  @IsEnum(PayPalCurrency)
  currency: PayPalCurrency;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  customId?: string;

  @IsOptional()
  @IsString()
  invoiceId?: string;

  @IsOptional()
  @IsString()
  returnUrl?: string;

  @IsOptional()
  @IsString()
  cancelUrl?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PayPalPayerDto)
  payer?: PayPalPayerDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PayPalShippingDto)
  shipping?: PayPalShippingDto;

  @IsOptional()
  @IsEnum(PayPalLandingPage)
  landingPage?: PayPalLandingPage;

  @IsOptional()
  @IsEnum(PayPalUserAction)
  userAction?: PayPalUserAction;

  @IsOptional()
  @IsString()
  brandName?: string;

  @IsOptional()
  @IsString()
  locale?: string; // e.g., 'en-US'

  @IsOptional()
  @IsString()
  shippingPreference?: 'GET_FROM_FILE' | 'NO_SHIPPING' | 'SET_PROVIDED_ADDRESS';
}

export class PayPalCaptureDto {
  @IsNumber()
  @IsNotEmpty()
  orderId: number;
}

export class PayPalRefundDto {
  @IsString()
  @IsNotEmpty()
  captureId: string;

  @IsOptional()
  @IsString()
  amount?: string; // If not provided, full refund

  @IsOptional()
  @IsEnum(PayPalCurrency)
  currency?: PayPalCurrency;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  noteToPayer?: string;
}

export class PayPalWebhookDto {
  @IsString()
  @IsNotEmpty()
  eventType: string;

  @IsObject()
  resource: any;

  @IsOptional()
  @IsObject()
  summary?: any;
}
