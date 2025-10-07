import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wishlist } from '../entity/wishlist.entity';
import { WishlistController } from '../controller/wishlist.controller';
import { WishlistService } from '../service/wishlist.service';
import { AuthModule } from 'src/core/auth/module/auth.module';
import { Product } from '../../product/entity/product.entity';
import { Customer } from 'src/modules/personnel-management/customer/entity/customer.entity';

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
