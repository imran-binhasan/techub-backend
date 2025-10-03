import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StripeService } from '../service/stripe.service';
import { StripeController } from '../controller/stripe.controller';

@Module({
  imports: [ConfigModule],
  controllers: [StripeController],
  providers: [StripeService],
  exports: [StripeService],
})
export class StripeModule {}
