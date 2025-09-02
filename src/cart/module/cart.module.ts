import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cart } from '../entity/cart.entity';
import { Customer } from 'src/customer/entity/customer.entity';
import { Product } from 'src/product/entity/product.entity';
import { CartService } from '../service/cart.service';
import { CartController } from '../controller/cart.controller';
import { AuthModule } from 'src/auth/module/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Cart, Customer, Product]), AuthModule],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
