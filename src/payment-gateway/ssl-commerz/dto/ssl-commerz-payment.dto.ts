import {
  IsString,
  IsNumber,
  IsEmail,
  IsOptional,
  IsEnum,
  Min,
  IsNotEmpty,
  IsPhoneNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum SSLCommerzCurrency {
  BDT = 'BDT',
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
}

export enum SSLCommerzProductCategory {
  GENERAL = 'general',
  PHYSICAL_GOODS = 'physical-goods',
  NON_PHYSICAL_GOODS = 'non-physical-goods',
  AIRLINE_TICKETS = 'airline-tickets',
  TRAVEL_VERTICAL = 'travel-vertical',
  TELECOM_VERTICAL = 'telecom-vertical',
}

export class SSLCommerzPaymentDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  totalAmount: number;

  @IsEnum(SSLCommerzCurrency)
  currency: SSLCommerzCurrency;

  @IsEnum(SSLCommerzProductCategory)
  productCategory: SSLCommerzProductCategory;

  @IsString()
  @IsNotEmpty()
  productName: string;

  @IsOptional()
  @IsString()
  productProfile?: string;

  @IsString()
  @IsNotEmpty()
  customerName: string;

  @IsEmail()
  customerEmail: string;

  @IsOptional()
  @IsString()
  customerAddress?: string;

  @IsOptional()
  @IsString()
  customerCity?: string;

  @IsOptional()
  @IsString()
  customerState?: string;

  @IsOptional()
  @IsString()
  customerPostcode?: string;

  @IsOptional()
  @IsString()
  customerCountry?: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  @IsOptional()
  @IsString()
  shippingMethod?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  numberOfProducts?: number;

  @IsOptional()
  @IsString()
  successUrl?: string;

  @IsOptional()
  @IsString()
  failUrl?: string;

  @IsOptional()
  @IsString()
  cancelUrl?: string;

  @IsOptional()
  @IsString()
  ipnUrl?: string;

  @IsOptional()
  @IsString()
  shippingAddress?: string;

  @IsOptional()
  @IsString()
  shippingCity?: string;

  @IsOptional()
  @IsString()
  shippingState?: string;

  @IsOptional()
  @IsString()
  shippingPostcode?: string;

  @IsOptional()
  @IsString()
  shippingCountry?: string;
}

export class SSLCommerzValidationDto {
  @IsString()
  @IsNotEmpty()
  valId: string;

  @IsString()
  @IsNotEmpty()
  storeId: string;

  @IsString()
  @IsNotEmpty()
  storePassword: string;
}

export interface SSLCommerzInitResponse {
  status: string;
  failedreason?: string;
  sessionkey?: string;
  gw?: {
    gatewayPageURL: string;
    storeBanner: string;
    storelogo: string;
    desc: string;
    is_direct_pay_enable: string;
  };
  redirectGatewayURL?: string;
  directPaymentURLBank?: string;
  directPaymentURLCard?: string;
  directPaymentURL?: string;
  redirectGatewayURLFailed?: string;
  GatewayPageURL?: string;
  storeBanner?: string;
  storelogo?: string;
  store_name?: string;
  urls?: any[];
  logo?: string;
  nofityurl?: string;
  result?: string;
}

export interface SSLCommerzValidationResponse {
  status: string;
  tran_date: string;
  tran_id: string;
  val_id: string;
  amount: string;
  store_amount: string;
  currency: string;
  bank_tran_id: string;
  card_type: string;
  card_no: string;
  card_issuer: string;
  card_brand: string;
  card_issuer_country: string;
  card_issuer_country_code: string;
  verify_sign: string;
  verify_key: string;
  verify_sign_sha2: string;
  currency_type: string;
  currency_amount: string;
  currency_rate: string;
  base_fair: string;
  value_a: string;
  value_b: string;
  value_c: string;
  value_d: string;
  risk_level: string;
  risk_title: string;
  APIConnect: string;
  validated_on: string;
  gw_version: string;
  campaign_code?: string;
  discount_percentage?: string;
  discount_amount?: string;
  discount_remarks?: string;
}
