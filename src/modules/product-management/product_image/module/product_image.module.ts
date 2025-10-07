import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductImage } from '../entity/product_image.entity';
import { AuthModule } from 'src/core/auth/module/auth.module';
import { ProductImageController } from '../controller/product_image.controller';
import { ProductImageService } from '../service/product_image.service';
import { Product } from '../../product/entity/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProductImage, Product]), AuthModule],
  controllers: [ProductImageController],
  providers: [ProductImageService],
  exports: [ProductImageService],
})
export class ProductImageModule {}
