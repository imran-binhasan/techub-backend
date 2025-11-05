import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SSLCommerzPaymentDto,
  SSLCommerzValidationDto,
  SSLCommerzInitResponse,
  SSLCommerzValidationResponse,
} from '../dto/ssl-commerz-payment.dto';

const SSLCommerzPayment = require('sslcommerz-lts');

@Injectable()
export class SslCommerzService {
  private readonly logger = new Logger(SslCommerzService.name);
  private sslCommerz: any;
  private storeId: string;
  private storePassword: string;
  private isLive: boolean;

  constructor(private readonly configService: ConfigService) {
    this.storeId = this.configService.get<string>('SSL_COMMERZ_STORE_ID', '');
    this.storePassword = this.configService.get<string>(
      'SSL_COMMERZ_STORE_PASSWORD',
      '',
    );
    this.isLive =
      this.configService.get<string>('SSL_COMMERZ_IS_LIVE', 'false') === 'true';

    if (!this.storeId || !this.storePassword) {
      this.logger.error(
        'SSL Commerz configuration is incomplete. Please check environment variables.',
      );
    }

    this.sslCommerz = new SSLCommerzPayment(
      this.storeId,
      this.storePassword,
      this.isLive,
    );
  }

  async initiatePayment(
    paymentData: SSLCommerzPaymentDto,
  ): Promise<SSLCommerzInitResponse> {
    try {
      const baseUrl = this.configService.get<string>(
        'APP_BASE_URL',
        'http://localhost:3000',
      );

      const data = {
        total_amount: paymentData.totalAmount,
        currency: paymentData.currency,
        tran_id: paymentData.orderId, // use orderId as transaction id
        success_url:
          paymentData.successUrl ||
          `${baseUrl}/api/payment-gateway/ssl-commerz/success`,
        fail_url:
          paymentData.failUrl ||
          `${baseUrl}/api/payment-gateway/ssl-commerz/fail`,
        cancel_url:
          paymentData.cancelUrl ||
          `${baseUrl}/api/payment-gateway/ssl-commerz/cancel`,
        ipn_url:
          paymentData.ipnUrl ||
          `${baseUrl}/api/payment-gateway/ssl-commerz/ipn`,
        shipping_method: paymentData.shippingMethod || 'Courier',
        product_name: paymentData.productName,
        product_category: paymentData.productCategory,
        product_profile: paymentData.productProfile || 'general',
        cus_name: paymentData.customerName,
        cus_email: paymentData.customerEmail,
        cus_add1: paymentData.customerAddress || 'N/A',
        cus_add2: 'N/A',
        cus_city: paymentData.customerCity || 'Dhaka',
        cus_state: paymentData.customerState || 'Dhaka',
        cus_postcode: paymentData.customerPostcode || '1000',
        cus_country: paymentData.customerCountry || 'Bangladesh',
        cus_phone: paymentData.customerPhone || '01711111111',
        cus_fax: '01711111111',
        ship_name: paymentData.customerName,
        ship_add1:
          paymentData.shippingAddress || paymentData.customerAddress || 'N/A',
        ship_add2: 'N/A',
        ship_city:
          paymentData.shippingCity || paymentData.customerCity || 'Dhaka',
        ship_state:
          paymentData.shippingState || paymentData.customerState || 'Dhaka',
        ship_postcode:
          paymentData.shippingPostcode ||
          paymentData.customerPostcode ||
          '1000',
        ship_country:
          paymentData.shippingCountry ||
          paymentData.customerCountry ||
          'Bangladesh',
        num_of_item: paymentData.numberOfProducts || 1,
      };

      this.logger.debug('Initiating SSL Commerz payment with data:', data);

      const apiResponse = await this.sslCommerz.init(data);

      this.logger.debug('SSL Commerz init response:', apiResponse);

      if (apiResponse.status !== 'SUCCESS') {
        throw new BadRequestException(
          `SSL Commerz payment initiation failed: ${apiResponse.failedreason || 'Unknown error'}`,
        );
      }

      return apiResponse;
    } catch (error) {
      this.logger.error('Error initiating SSL Commerz payment:', error);
      throw new BadRequestException(
        `Failed to initiate payment: ${error.message}`,
      );
    }
  }

  async validatePayment(
    validationData: SSLCommerzValidationDto,
  ): Promise<SSLCommerzValidationResponse> {
    try {
      this.logger.debug(
        'Validating SSL Commerz payment with valId:',
        validationData.valId,
      );

      const validation = await this.sslCommerz.validate({
        val_id: validationData.valId,
        store_id: this.storeId,
        store_passwd: this.storePassword,
      });

      this.logger.debug('SSL Commerz validation response:', validation);

      if (validation.status !== 'VALID') {
        throw new BadRequestException(
          `Payment validation failed: ${validation.status}`,
        );
      }

      return validation;
    } catch (error) {
      this.logger.error('Error validating SSL Commerz payment:', error);
      throw new BadRequestException(
        `Failed to validate payment: ${error.message}`,
      );
    }
  }

  async initiateRefund(
    bankTransId: string,
    refundAmount: number,
    refundRemarks?: string,
  ): Promise<any> {
    try {
      const refundData = {
        bank_tran_id: bankTransId,
        refund_amount: refundAmount,
        refund_remarks: refundRemarks || 'Customer refund request',
      };

      this.logger.debug('Initiating SSL Commerz refund:', refundData);

      const refundResponse = await this.sslCommerz.initiateRefund(refundData);

      this.logger.debug('SSL Commerz refund response:', refundResponse);

      return refundResponse;
    } catch (error) {
      this.logger.error('Error initiating SSL Commerz refund:', error);
      throw new BadRequestException(
        `Failed to initiate refund: ${error.message}`,
      );
    }
  }

  async queryTransaction(transactionId: string): Promise<any> {
    try {
      this.logger.debug('Querying SSL Commerz transaction:', transactionId);

      const queryResponse =
        await this.sslCommerz.transactionQueryByTransactionId({
          tran_id: transactionId,
          store_id: this.storeId,
          store_passwd: this.storePassword,
        });

      this.logger.debug('SSL Commerz query response:', queryResponse);

      return queryResponse;
    } catch (error) {
      this.logger.error('Error querying SSL Commerz transaction:', error);
      throw new BadRequestException(
        `Failed to query transaction: ${error.message}`,
      );
    }
  }

  async queryTransactionBySessionkey(sessionKey: string): Promise<any> {
    try {
      this.logger.debug(
        'Querying SSL Commerz transaction by session key:',
        sessionKey,
      );

      const queryResponse = await this.sslCommerz.transactionQueryBySessionkey({
        sessionkey: sessionKey,
        store_id: this.storeId,
        store_passwd: this.storePassword,
      });

      this.logger.debug(
        'SSL Commerz query by session response:',
        queryResponse,
      );

      return queryResponse;
    } catch (error) {
      this.logger.error(
        'Error querying SSL Commerz transaction by session:',
        error,
      );
      throw new BadRequestException(
        `Failed to query transaction by session: ${error.message}`,
      );
    }
  }

  getPaymentStatus(): {
    storeId: string;
    isLive: boolean;
    configured: boolean;
  } {
    return {
      storeId: this.storeId,
      isLive: this.isLive,
      configured: !!(this.storeId && this.storePassword),
    };
  }
}
