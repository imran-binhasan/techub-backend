import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import {
  PayPalOrderDto,
  PayPalCaptureDto,
  PayPalRefundDto,
} from '../dto/paypal-payment.dto';

@Injectable()
export class PayPalService {
  private readonly logger = new Logger(PayPalService.name);
  private axiosInstance: AxiosInstance;
  private clientId: string;
  private clientSecret: string;
  private environment: 'sandbox' | 'live';
  private baseUrl: string;
  private accessToken: string;
  private tokenExpiry: Date;

  constructor(private readonly configService: ConfigService) {
    this.clientId = this.configService.get<string>('PAYPAL_CLIENT_ID', '');
    this.clientSecret = this.configService.get<string>('PAYPAL_CLIENT_SECRET', '');
    this.environment = this.configService.get<string>('PAYPAL_ENVIRONMENT', 'sandbox') as 'sandbox' | 'live';

    if (!this.clientId || !this.clientSecret) {
      this.logger.error('PayPal configuration is incomplete. Please check environment variables.');
      return;
    }

    this.baseUrl = this.environment === 'live' 
      ? 'https://api.paypal.com'
      : 'https://api.sandbox.paypal.com';

    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.logger.log('PayPal service initialized successfully');
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      
      const response = await this.axiosInstance.post('/v1/oauth2/token', 
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.accessToken = response.data.access_token;
      const expiresIn = response.data.expires_in;
      this.tokenExpiry = new Date(Date.now() + (expiresIn * 1000) - 60000);

      return this.accessToken;
    } catch (error) {
      this.logger.error('Error getting PayPal access token:', error);
      throw new BadRequestException('Failed to authenticate with PayPal');
    }
  }

  async createOrder(orderData: PayPalOrderDto): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();
      const baseAppUrl = this.configService.get<string>('APP_BASE_URL', 'http://localhost:3000');
      
      const requestBody = {
        intent: orderData.intent,
        purchase_units: [
          {
            reference_id: orderData.orderId,
            description: orderData.description,
            custom_id: orderData.customId,
            invoice_id: orderData.invoiceId,
            amount: {
              currency_code: orderData.currency,
              value: orderData.totalAmount,
              breakdown: {
                item_total: {
                  currency_code: orderData.currency,
                  value: orderData.items.reduce(
                    (total, item) => total + (parseFloat(item.unitAmount) * item.quantity),
                    0
                  ).toFixed(2),
                },
              },
            },
            items: orderData.items.map(item => ({
              name: item.name,
              description: item.description,
              sku: item.sku,
              quantity: item.quantity.toString(),
              category: item.category || 'PHYSICAL_GOODS',
              unit_amount: {
                currency_code: item.currency,
                value: item.unitAmount,
              },
            })),
          },
        ],
        application_context: {
          return_url: orderData.returnUrl || `${baseAppUrl}/api/payment-gateway/paypal/return`,
          cancel_url: orderData.cancelUrl || `${baseAppUrl}/api/payment-gateway/paypal/cancel`,
          brand_name: orderData.brandName || 'Ecommerce Store',
          locale: orderData.locale || 'en-US',
          landing_page: orderData.landingPage || 'NO_PREFERENCE',
          shipping_preference: orderData.shippingPreference || 'GET_FROM_FILE',
          user_action: orderData.userAction || 'PAY_NOW',
        },
      };

      const response = await this.axiosInstance.post('/v2/checkout/orders', requestBody, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      return response.data;
    } catch (error) {
      this.logger.error('Error creating PayPal order:', error.response?.data || error);
      throw new BadRequestException(
        `Failed to create PayPal order: ${error.response?.data?.message || error.message}`
      );
    }
  }

  async captureOrder(captureData: PayPalCaptureDto): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await this.axiosInstance.post(
        `/v2/checkout/orders/${captureData.orderId}/capture`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      this.logger.error('Error capturing PayPal order:', error.response?.data || error);
      throw new BadRequestException(
        `Failed to capture PayPal order: ${error.response?.data?.message || error.message}`
      );
    }
  }

  async getOrder(orderId: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await this.axiosInstance.get(`/v2/checkout/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      return response.data;
    } catch (error) {
      this.logger.error('Error retrieving PayPal order:', error.response?.data || error);
      throw new BadRequestException(
        `Failed to retrieve PayPal order: ${error.response?.data?.message || error.message}`
      );
    }
  }

  async authorizeOrder(orderId: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await this.axiosInstance.post(
        `/v2/checkout/orders/${orderId}/authorize`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      this.logger.error('Error authorizing PayPal order:', error.response?.data || error);
      throw new BadRequestException(
        `Failed to authorize PayPal order: ${error.response?.data?.message || error.message}`
      );
    }
  }

  async refundCapture(refundData: PayPalRefundDto): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();
      
      const requestBody: any = {
        note_to_payee: refundData.reason,
        note_to_payer: refundData.noteToPayer,
      };

      if (refundData.amount && refundData.currency) {
        requestBody.amount = {
          value: refundData.amount,
          currency_code: refundData.currency,
        };
      }

      const response = await this.axiosInstance.post(
        `/v2/payments/captures/${refundData.captureId}/refund`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      this.logger.error('Error creating PayPal refund:', error.response?.data || error);
      throw new BadRequestException(
        `Failed to create PayPal refund: ${error.response?.data?.message || error.message}`
      );
    }
  }

  async getCapture(captureId: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await this.axiosInstance.get(`/v2/payments/captures/${captureId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      return response.data;
    } catch (error) {
      this.logger.error('Error retrieving PayPal capture:', error.response?.data || error);
      throw new BadRequestException(
        `Failed to retrieve PayPal capture: ${error.response?.data?.message || error.message}`
      );
    }
  }

  async getRefund(refundId: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await this.axiosInstance.get(`/v2/payments/refunds/${refundId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      return response.data;
    } catch (error) {
      this.logger.error('Error retrieving PayPal refund:', error.response?.data || error);
      throw new BadRequestException(
        `Failed to retrieve PayPal refund: ${error.response?.data?.message || error.message}`
      );
    }
  }

  getPaymentStatus(): { environment: string; configured: boolean } {
    return {
      environment: this.environment,
      configured: !!(this.clientId && this.clientSecret),
    };
  }
}
