import { Module } from '@nestjs/common';
import { SslCommerzModule } from './ssl-commerz/module/ssl-commerz.module';
import { StripeModule } from './stripe/module/stripe.module';
import { PayPalModule } from './paypal/module/paypal.module';

@Module({
  imports: [SslCommerzModule, StripeModule, PayPalModule],
  exports: [SslCommerzModule, StripeModule, PayPalModule],
})
export class PaymentGatewayModule {}
