import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cart } from '../entity/cart.entity';
import { CartService } from '../service/cart.service';
import { CartController } from '../controller/cart.controller';
import { AuthModule } from 'src/core/auth/module/auth.module';
import { Customer } from 'src/modules/personnel-management/customer/entity/customer.entity';
import { Product } from '../../product/entity/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Cart, Customer, Product]), AuthModule],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
