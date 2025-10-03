import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from 'src/product-management/product/entity/product.entity';
import { ProductReview } from '../entity/product_review.entity';
import { ProductReviewController } from '../controller/product_review.controller';
import { ProductReviewService } from '../service/product_review.service';
import { AuthModule } from 'src/core/auth/module/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([ProductReview, Product]), AuthModule],
  controllers: [ProductReviewController],
  providers: [ProductReviewService],
  exports: [ProductReviewService],
})
export class ProductReviewModule {}
