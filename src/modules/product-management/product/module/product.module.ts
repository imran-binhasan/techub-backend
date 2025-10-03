import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductService } from '../service/product.service';
import { ProductController } from '../controller/product.controller';
import { Product } from '../entity/product.entity';
import { ProductAttributeValue } from '../entity/product_attribute_value.entity';
import { Category } from 'src/product-management/category/entity/category.entity';
import { Brand } from 'src/product-management/brand/entity/brand.entity';
import { AttributeValue } from 'src/product-management/attribute_value/entity/attribute_value.entity';
import { Cart } from 'src/product-management/cart/entity/cart.entity';
import { Wishlist } from 'src/product-management/wishlist/entity/wishlist.entity';
import { ProductReview } from 'src/product-management/product_review/entity/product_review.entity';
import { ProductImage } from 'src/product-management/product_image/entity/product_image.entity';
import { AuthModule } from 'src/core/auth/module/auth.module';
import { UploadModule } from 'src/core/upload/module/upload.module';

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
