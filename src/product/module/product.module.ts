import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductService } from '../service/product.service';
import { ProductController } from '../controller/product.controller';
import { Product } from '../entity/product.entity';
import { ProductAttributeValue } from '../entity/product_attribute_value.entity';
import { Category } from 'src/category/entity/category.entity';
import { Brand } from 'src/brand/entity/brand.entity';
import { AttributeValue } from 'src/attribute_value/entity/attribute_value.entity';
import { Cart } from 'src/cart/entity/cart.entity';
import { Wishlist } from 'src/wishlist/entity/wishlist.entity';
import { ProductReview } from 'src/product_review/entity/product_review.entity';
import { ProductImage } from 'src/product_image/entity/product_image.entity';
import { AuthModule } from 'src/auth/module/auth.module';
import { UploadModule } from 'src/upload/module/upload.module';

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
