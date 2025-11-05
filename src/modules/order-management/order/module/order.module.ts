import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderService } from '../service/order.service';
import { OrderController } from '../controller/order.controller';
import { Order } from '../entity/order.entity';
import { OrderItem } from '../entity/order-item.entity';
import { InventoryModule } from '../../inventory/module/inventory.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthModule } from 'src/core/auth/module/auth.module';
import { CustomerModule } from 'src/modules/personnel-management/customer/module/customer.module';
import { ProductModule } from 'src/modules/product-management/product/module/product.module';
import { CartModule } from 'src/modules/product-management/cart/module/cart.module';
import { CouponModule } from 'src/modules/product-management/coupon/module/coupon.module';
import { AddressModule } from 'src/modules/personnel-management/address/module/address.module';

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
    AuthModule,
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService, TypeOrmModule],
})
export class OrderModule {}
