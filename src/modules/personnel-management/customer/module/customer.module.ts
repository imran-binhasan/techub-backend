import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CloudinaryService } from 'src/core/upload/service/cloudinary.service';
import { Customer } from '../entity/customer.entity';
import { User } from '../../user/entity/user.entity';
import { CustomerController } from '../controller/customer.controller';
import { CustomerService } from '../service/customer.service';
import { Address } from '../../address/entity/address.entity';
import { Cart } from 'src/modules/product-management/cart/entity/cart.entity';
import { Wishlist } from 'src/modules/product-management/wishlist/entity/wishlist.entity';
import { Notification } from 'src/modules/notification-management/notification/entity/notification.entity';
import { AuthModule } from 'src/core/auth/module/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer, User, Address, Cart, Wishlist, Notification]),
    AuthModule,
  ],
  controllers: [CustomerController],
  providers: [CustomerService, CloudinaryService],
  exports: [CustomerService],
})
export class CustomerModule {}
