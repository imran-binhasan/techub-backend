import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderService } from '../service/order.service';
import { OrderController } from '../controller/order.controller';
import { Order } from '../entity/order.entity';
import { OrderItem } from '../entity/order-item.entity';
import { CustomerModule } from '../../customer/module/customer.module';
import { ProductModule } from '../../product/module/product.module';
import { CartModule } from '../../cart/module/cart.module';
import { CouponModule } from '../../coupon/module/coupon.module';
import { AddressModule } from '../../address/module/address.module';
import { InventoryModule } from '../../inventory/module/inventory.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthModule } from 'src/auth/module/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem]),
    forwardRef(() => CustomerModule),
    forwardRef(() => ProductModule),
    forwardRef(() => CartModule),
    forwardRef(() => CouponModule),
    forwardRef(() => AddressModule),
    forwardRef(() => InventoryModule),
    EventEmitterModule.forRoot(),
    AuthModule
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService, TypeOrmModule],
})
export class OrderModule {}
