import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from 'src/product/entity/product.entity';
import { ProductImage } from '../entity/product_image.entity';
import { AuthModule } from 'src/auth/module/auth.module';
import { ProductImageController } from '../controller/product_image.controller';
import { ProductImageService } from '../service/product_image.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProductImage, Product]), AuthModule],
  controllers: [ProductImageController],
  providers: [ProductImageService],
  exports: [ProductImageService],
})
export class ProductImageModule {}
