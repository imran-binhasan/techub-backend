import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrandService } from '../service/brand.service';
import { BrandController } from '../controller/brand.controller';
import { Brand } from '../entity/brand.entity';
import { CloudinaryService } from 'src/upload/service/cloudinary.service';

@Module({
  imports: [TypeOrmModule.forFeature([Brand])],
  controllers: [BrandController],
  providers: [BrandService, CloudinaryService],
  exports: [BrandService],
})
export class BrandModule {}