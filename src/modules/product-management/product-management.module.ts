import { Module } from '@nestjs/common';
import { ProductModule } from './product/module/product.module';
import { ProductImageModule } from './product_image/module/product_image.module';
import { CategoryModule } from './category/module/category.module';
import { BrandModule } from './brand/module/brand.module';
import { CartModule } from './cart/module/cart.module';
import { WishlistModule } from './wishlist/module/wishlist.module';
import { AttributeModule } from './attribute/module/attribute.module';
import { AttributeValueModule } from './attribute_value/module/attribute_value.module';
import { CouponModule } from './coupon/module/coupon.module';
import { ProductReviewModule } from './product_review/module/product_review.module';

/**
 * Product Management Module
 * Aggregates all product-related feature modules
 */
@Module({
  imports: [
    ProductModule,
    ProductImageModule,
    CategoryModule,
    BrandModule,
    AttributeModule,
    AttributeValueModule,
    CouponModule,
    CartModule,
    WishlistModule,
    ProductReviewModule,
  ],
  controllers: [],
  providers: [],
  exports: [
    ProductModule,
    ProductImageModule,
    CategoryModule,
    BrandModule,
    AttributeModule,
    AttributeValueModule,
    CouponModule,
    CartModule,
    WishlistModule,
    ProductReviewModule,
  ],
})
export class ProductManagementModule {}