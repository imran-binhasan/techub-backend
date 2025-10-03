import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from 'src/user-management/customer/entity/customer.entity';
import { Product } from 'src/product-management/product/entity/product.entity';
import { Wishlist } from '../entity/wishlist.entity';
import { WishlistController } from '../controller/wishlist.controller';
import { WishlistService } from '../service/wishlist.service';
import { AuthModule } from 'src/core/auth/module/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wishlist, Customer, Product]),
    AuthModule,
  ],
  controllers: [WishlistController],
  providers: [WishlistService],
  exports: [WishlistService],
})
export class WishlistModule {}
