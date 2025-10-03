import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentService } from '../service/payment.service';
import { PaymentController } from '../controller/payment.controller';
import { Payment } from '../entity/payment.entity';
import { OrderModule } from '../../order-management/order/module/order.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthModule } from 'src/core/auth/module/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment]),
    forwardRef(() => OrderModule),
    EventEmitterModule.forRoot(),
    AuthModule
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService, TypeOrmModule],
})
export class PaymentModule {}
