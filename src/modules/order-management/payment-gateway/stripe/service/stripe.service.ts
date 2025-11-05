import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import {
  StripePaymentIntentDto,
  StripeCheckoutSessionDto,
  StripeRefundDto,
  StripeCurrency,
} from '../dto/stripe-payment.dto';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private stripe: Stripe;
  private webhookSecret: string;

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY', '');
    this.webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
      '',
    );

    if (!secretKey) {
      this.logger.error(
        'Stripe secret key is not configured. Please check environment variables.',
      );
      return;
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-08-27.basil',
      typescript: true,
    });

    this.logger.log('Stripe service initialized successfully');
  }

  async createPaymentIntent(
    paymentData: StripePaymentIntentDto,
  ): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntentData: Stripe.PaymentIntentCreateParams = {
        amount: paymentData.amount,
        currency: paymentData.currency,
        metadata: {
          orderId: paymentData.orderId,
          ...paymentData.metadata,
        },
        description: paymentData.description,
      };

      // Add customer if provided
      if (paymentData.customerId) {
        paymentIntentData.customer = paymentData.customerId;
      } else if (paymentData.customer) {
        // Create customer if customer data is provided
        const customer = await this.createCustomer(paymentData.customer);
        paymentIntentData.customer = customer.id;
      }

      // Set payment method types
      if (paymentData.paymentMethodTypes?.length) {
        paymentIntentData.payment_method_types = paymentData.paymentMethodTypes;
      }

      // Enable automatic payment methods if specified
      if (paymentData.automaticPaymentMethods) {
        paymentIntentData.automatic_payment_methods = {
          enabled: true,
        };
      }

      const paymentIntent =
        await this.stripe.paymentIntents.create(paymentIntentData);

      this.logger.debug('Created Stripe payment intent:', paymentIntent.id);

      return paymentIntent;
    } catch (error) {
      this.logger.error('Error creating Stripe payment intent:', error);
      throw new BadRequestException(
        `Failed to create payment intent: ${error.message}`,
      );
    }
  }

  async createCheckoutSession(
    sessionData: StripeCheckoutSessionDto,
  ): Promise<Stripe.Checkout.Session> {
    try {
      const baseUrl = this.configService.get<string>(
        'APP_BASE_URL',
        'http://localhost:3000',
      );

      const sessionConfig: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: sessionData.paymentMethodTypes || ['card'],
        line_items: sessionData.lineItems.map((item) => ({
          price_data: {
            currency: sessionData.currency,
            product_data: {
              name: item.name,
              description: item.description,
              images: item.images,
            },
            unit_amount: item.unitAmount,
          },
          quantity: item.quantity,
        })),
        mode: sessionData.mode || 'payment',
        success_url:
          sessionData.successUrl ||
          `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: sessionData.cancelUrl || `${baseUrl}/payment/cancelled`,
        metadata: {
          orderId: sessionData.orderId,
          ...sessionData.metadata,
        },
      };

      // Add customer if provided
      if (sessionData.customerId) {
        sessionConfig.customer = sessionData.customerId;
      } else if (sessionData.customer) {
        sessionConfig.customer_email = sessionData.customer.email;
        if (sessionData.customer.name) {
          sessionConfig.customer_creation = 'always';
        }
      }

      // Enable promotion codes if specified
      if (sessionData.allowPromotionCodes) {
        sessionConfig.allow_promotion_codes = true;
      }

      const session = await this.stripe.checkout.sessions.create(sessionConfig);

      this.logger.debug('Created Stripe checkout session:', session.id);

      return session;
    } catch (error) {
      this.logger.error('Error creating Stripe checkout session:', error);
      throw new BadRequestException(
        `Failed to create checkout session: ${error.message}`,
      );
    }
  }

  async createCustomer(customerData: any): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.create({
        email: customerData.email,
        name: customerData.name,
        phone: customerData.phone,
        address: customerData.address,
        shipping: customerData.shipping,
      });

      this.logger.debug('Created Stripe customer:', customer.id);

      return customer;
    } catch (error) {
      this.logger.error('Error creating Stripe customer:', error);
      throw new BadRequestException(
        `Failed to create customer: ${error.message}`,
      );
    }
  }

  async retrievePaymentIntent(
    paymentIntentId: string,
  ): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent =
        await this.stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      this.logger.error('Error retrieving Stripe payment intent:', error);
      throw new BadRequestException(
        `Failed to retrieve payment intent: ${error.message}`,
      );
    }
  }

  async retrieveCheckoutSession(
    sessionId: string,
  ): Promise<Stripe.Checkout.Session> {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId);
      return session;
    } catch (error) {
      this.logger.error('Error retrieving Stripe checkout session:', error);
      throw new BadRequestException(
        `Failed to retrieve checkout session: ${error.message}`,
      );
    }
  }

  async createRefund(refundData: StripeRefundDto): Promise<Stripe.Refund> {
    try {
      const refundConfig: Stripe.RefundCreateParams = {
        payment_intent: refundData.paymentIntentId,
        reason: refundData.reason,
        metadata: refundData.metadata,
      };

      if (refundData.amount) {
        refundConfig.amount = refundData.amount;
      }

      const refund = await this.stripe.refunds.create(refundConfig);

      this.logger.debug('Created Stripe refund:', refund.id);

      return refund;
    } catch (error) {
      this.logger.error('Error creating Stripe refund:', error);
      throw new BadRequestException(
        `Failed to create refund: ${error.message}`,
      );
    }
  }

  async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodId?: string,
  ): Promise<Stripe.PaymentIntent> {
    try {
      const confirmData: Stripe.PaymentIntentConfirmParams = {};

      if (paymentMethodId) {
        confirmData.payment_method = paymentMethodId;
      }

      const paymentIntent = await this.stripe.paymentIntents.confirm(
        paymentIntentId,
        confirmData,
      );

      this.logger.debug('Confirmed Stripe payment intent:', paymentIntent.id);

      return paymentIntent;
    } catch (error) {
      this.logger.error('Error confirming Stripe payment intent:', error);
      throw new BadRequestException(
        `Failed to confirm payment intent: ${error.message}`,
      );
    }
  }

  async cancelPaymentIntent(
    paymentIntentId: string,
  ): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent =
        await this.stripe.paymentIntents.cancel(paymentIntentId);

      this.logger.debug('Cancelled Stripe payment intent:', paymentIntent.id);

      return paymentIntent;
    } catch (error) {
      this.logger.error('Error cancelling Stripe payment intent:', error);
      throw new BadRequestException(
        `Failed to cancel payment intent: ${error.message}`,
      );
    }
  }

  async constructWebhookEvent(
    body: string,
    signature: string,
  ): Promise<Stripe.Event> {
    try {
      const event = this.stripe.webhooks.constructEvent(
        body,
        signature,
        this.webhookSecret,
      );
      return event;
    } catch (error) {
      this.logger.error('Error constructing Stripe webhook event:', error);
      throw new BadRequestException(
        `Invalid webhook signature: ${error.message}`,
      );
    }
  }

  async listPaymentMethods(
    customerId: number,
  ): Promise<Stripe.PaymentMethod[]> {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId.toString(),
        type: 'card',
      });

      return paymentMethods.data;
    } catch (error) {
      this.logger.error('Error listing Stripe payment methods:', error);
      throw new BadRequestException(
        `Failed to list payment methods: ${error.message}`,
      );
    }
  }

  getPaymentStatus(): { configured: boolean; webhookConfigured: boolean } {
    return {
      configured: !!this.stripe,
      webhookConfigured: !!this.webhookSecret,
    };
  }
}
