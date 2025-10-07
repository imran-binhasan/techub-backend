import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductService } from '../service/product.service';
import { ProductController } from '../controller/product.controller';
import { Product } from '../entity/product.entity';
import { ProductAttributeValue } from '../entity/product_attribute_value.entity';
import { AuthModule } from 'src/core/auth/module/auth.module';
import { UploadModule } from 'src/core/upload/module/upload.module';
import { ProductImage } from '../../product_image/entity/product_image.entity';
import { Category } from '../../category/entity/category.entity';
import { Brand } from '../../brand/entity/brand.entity';
import { Cart } from '../../cart/entity/cart.entity';
import { Wishlist } from '../../wishlist/entity/wishlist.entity';
import { ProductReview } from '../../product_review/entity/product_review.entity';
import { AttributeValue } from '../../attribute_value/entity/attribute_value.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductImage,
      ProductAttributeValue,
      Category,
      Brand,
      AttributeValue,
      Cart,
      Wishlist,
      ProductReview,
    ]),
    AuthModule,
    UploadModule,
  ],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}
