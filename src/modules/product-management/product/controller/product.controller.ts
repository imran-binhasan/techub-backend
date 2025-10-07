// src/product/controller/product.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { ProductService } from '../service/product.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import {
  RequirePermissions,
  RequireResource,
  Public,
} from 'src/core/auth/decorator/auth.decorator';
import { ProductQueryDto } from '../dto/query-product.dto';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @RequireResource('product', 'create')
  @Post()
  async create(@Body() createProductDto: CreateProductDto) {
    const result = await this.productService.create(createProductDto);
    return {
      success: true,
      message: 'Product created successfully',
      data: result,
    };
  }

  @Public()
  @Get()
  async findAll(@Query() query: ProductQueryDto) {
    const result = await this.productService.findAll(query);
    return {
      success: true,
      message: 'Products retrieved successfully',
      data: result,
    };
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const result = await this.productService.findOne(id);
    return {
      success: true,
      message: 'Product retrieved successfully',
      data: result,
    };
  }

  @RequireResource('product', 'update')
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    const result = await this.productService.update(id, updateProductDto);
    return {
      success: true,
      message: 'Product updated successfully',
      data: result,
    };
  }

  @RequireResource('product', 'delete')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.productService.remove(id);
    return {
      success: true,
      message: 'Product deleted successfully',
    };
  }

  @RequireResource('product', 'manage')
  @Patch(':id/restore')
  @HttpCode(HttpStatus.OK)
  async restore(@Param('id', ParseIntPipe) id: number) {
    const result = await this.productService.restore(id);
    return {
      success: true,
      message: 'Product restored successfully',
      data: result,
    };
  }

  @RequireResource('product', 'update')
  @Patch(':id/stock')
  async updateStock(
    @Param('id', ParseIntPipe) id: number,
    @Body('stock') stock: number,
  ) {
    const result = await this.productService.updateStock(id, stock);
    return {
      success: true,
      message: 'Product stock updated successfully',
      data: result,
    };
  }

  // Utility endpoints
  @Public()
  @Get('category/:categoryId')
  async findByCategory(@Param('categoryId', ParseIntPipe) categoryId: number) {
    const result = await this.productService.findByCategory(categoryId);
    return {
      success: true,
      message: 'Products by category retrieved successfully',
      data: result,
    };
  }

  @Public()
  @Get('brand/:brandId')
  async findByBrand(@Param('brandId', ParseIntPipe) brandId: number) {
    const result = await this.productService.findByBrand(brandId);
    return {
      success: true,
      message: 'Products by brand retrieved successfully',
      data: result,
    };
  }

  @RequirePermissions('read:product')
  @Get('stats/count')
  async getProductsCount() {
    const result = await this.productService.getProductsCount();
    return {
      success: true,
      message: 'Products count retrieved successfully',
      data: { count: result },
    };
  }

  @RequirePermissions('read:product')
  @Get('stats/low-stock')
  async getLowStockProducts(@Query('threshold') threshold?: number) {
    const result = await this.productService.getLowStockProducts(threshold);
    return {
      success: true,
      message: 'Low stock products retrieved successfully',
      data: result,
    };
  }
}
