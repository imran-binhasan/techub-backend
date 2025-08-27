import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CloudinaryService } from 'src/upload/service/cloudinary.service';
import { Customer } from '../entity/customer.entity';
import { CustomerController } from '../controller/customer.controller';
import { CustomerService } from '../service/customer.service';
import { Address } from 'src/address/entity/address.entity';
import { Cart } from 'src/cart/entity/cart.entity';
import { Wishlist } from 'src/wishlist/entity/wishlist.entity';
import { Notification } from 'src/notification/entity/notification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer,Address,Cart,Wishlist,Notification]),
  ],
  controllers: [CustomerController],
  providers: [
    CustomerService,
    CloudinaryService,
  ],
  exports: [CustomerService],
})
export class CustomerModule {}