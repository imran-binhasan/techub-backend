import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PayPalService } from '../service/paypal.service';
import { PayPalController } from '../controller/paypal.controller';

@Module({
  imports: [ConfigModule],
  controllers: [PayPalController],
  providers: [PayPalService],
  exports: [PayPalService],
})
export class PayPalModule {}
