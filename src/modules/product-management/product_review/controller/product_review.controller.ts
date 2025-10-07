// src/product-review/controller/product-review.controller.ts
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
import {
  RequirePermissions,
  RequireResource,
  Public,
} from 'src/core/auth/decorator/auth.decorator';
import { CreateProductReviewDto } from '../dto/create-product_review.dto';
import { UpdateProductReviewDto } from '../dto/update-product_review.dto';
import { ProductReviewQueryDto } from '../dto/query-product_review.dto';
import { ProductReviewService } from '../service/product_review.service';

@Controller('product-review')
export class ProductReviewController {
  constructor(private readonly productReviewService: ProductReviewService) {}

  @RequireResource('product-review', 'create')
  @Post()
  async create(@Body() createProductReviewDto: CreateProductReviewDto) {
    const result = await this.productReviewService.create(
      createProductReviewDto,
    );
    return {
      success: true,
      message: 'Product review created successfully',
      data: result,
    };
  }

  @Public()
  @Get()
  async findAll(@Query() query: ProductReviewQueryDto) {
    const result = await this.productReviewService.findAll(query);
    return {
      success: true,
      message: 'Product reviews retrieved successfully',
      data: result,
    };
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const result = await this.productReviewService.findOne(id);
    return {
      success: true,
      message: 'Product review retrieved successfully',
      data: result,
    };
  }

  @RequireResource('product-review', 'update')
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductReviewDto: UpdateProductReviewDto,
  ) {
    const result = await this.productReviewService.update(
      id,
      updateProductReviewDto,
    );
    return {
      success: true,
      message: 'Product review updated successfully',
      data: result,
    };
  }

  @RequireResource('product-review', 'delete')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.productReviewService.remove(id);
    return {
      success: true,
      message: 'Product review deleted successfully',
    };
  }

  @RequireResource('product-review', 'manage')
  @Patch(':id/restore')
  @HttpCode(HttpStatus.OK)
  async restore(@Param('id', ParseIntPipe) id: number) {
    const result = await this.productReviewService.restore(id);
    return {
      success: true,
      message: 'Product review restored successfully',
      data: result,
    };
  }

  // Utility endpoints
  @Public()
  @Get('product/:productId')
  async findByProduct(
    @Param('productId', ParseIntPipe) productId: number,
    @Query() query: ProductReviewQueryDto,
  ) {
    const result = await this.productReviewService.findByProduct(
      productId,
      query,
    );
    return {
      success: true,
      message: 'Product reviews by product retrieved successfully',
      data: result,
    };
  }

  @Public()
  @Get('product/:productId/average-rating')
  async getAverageRating(@Param('productId', ParseIntPipe) productId: number) {
    const result = await this.productReviewService.getAverageRating(productId);
    return {
      success: true,
      message: 'Average rating retrieved successfully',
      data: { averageRating: result },
    };
  }

  @RequirePermissions('read:product-review')
  @Get('stats/count')
  async getReviewsCount() {
    const result = await this.productReviewService.getReviewsCount();
    return {
      success: true,
      message: 'Product reviews count retrieved successfully',
      data: { count: result },
    };
  }

  @RequirePermissions('read:product-review')
  @Get('stats/by-rating')
  async getReviewsByRating() {
    const result = await this.productReviewService.getReviewsByRating();
    return {
      success: true,
      message: 'Reviews by rating retrieved successfully',
      data: result,
    };
  }
}
