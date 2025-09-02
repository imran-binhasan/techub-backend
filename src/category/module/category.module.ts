// src/category/module/category.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from '../entity/category.entity';
import { CategoryController } from '../controller/category.controller';
import { CategoryService } from '../service/category.service';
import { AuthModule } from 'src/auth/module/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Category]), AuthModule],
  controllers: [CategoryController],
  providers: [CategoryService],
  exports: [CategoryService],
})
export class CategoryModule {}
