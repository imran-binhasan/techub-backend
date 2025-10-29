import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CloudinaryService } from 'src/core/upload/service/cloudinary.service';
import { Customer } from '../entity/customer.entity';
import { User } from '../../user/entity/user.entity';
import { Address } from '../../address/entity/address.entity';
import { Cart } from 'src/modules/product-management/cart/entity/cart.entity';
import { Wishlist } from 'src/modules/product-management/wishlist/entity/wishlist.entity';
import { Notification } from 'src/modules/notification-management/notification/entity/notification.entity';
import { AuthModule } from 'src/core/auth/module/auth.module';
import { CacheModule } from '@nestjs/cache-manager';
import { UploadModule } from 'src/core/upload/module/upload.module';
import { CustomerAuthController } from '../controller/customer-auth.controller';
import { CustomerProfileController } from '../controller/customer-profile.controller';
import { CustomerAuthService } from '../service/customer-auth.service';
import { CustomerProfileService } from '../service/customer-profile.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Customer]),
    CacheModule,
    UploadModule,
  ],
  controllers: [
    CustomerAuthController,
    CustomerProfileController,
    // CustomerAddressController,
    // CustomerOrderController,
  ],
  providers: [
    CustomerAuthService,
    CustomerProfileService,
    // CustomerAddressService,
    // CustomerOrderService,
  ],
  exports: [CustomerAuthService, CustomerProfileService],
})
export class CustomerModule {}
