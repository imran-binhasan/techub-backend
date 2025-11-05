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
  Public,
  RequireResource,
} from 'src/core/auth/decorator/auth.decorator';
import { ProductImageService } from '../service/product_image.service';
import { CreateProductImageDto } from '../dto/create-product_image.dto';
import { UpdateProductImageDto } from '../dto/update-product_image.dto';
import { ProductImageQueryDto } from '../dto/query-product_image.dto';

@Controller('product-image')
export class ProductImageController {
  constructor(private readonly productImageService: ProductImageService) {}

  @RequireResource('product_image', 'create')
  @Post()
  async create(@Body() createProductImageDto: CreateProductImageDto) {
    const result = await this.productImageService.create(createProductImageDto);
    return {
      success: true,
      message: 'Product image created successfully',
      data: result,
    };
  }

  @Public()
  @Get()
  async findAll(@Query() query: ProductImageQueryDto) {
    const result = await this.productImageService.findAll(query);
    return {
      success: true,
      message: 'Product images retrieved successfully',
      data: result,
    };
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const result = await this.productImageService.findOne(id);
    return {
      success: true,
      message: 'Product image retrieved successfully',
      data: result,
    };
  }

  @RequireResource('product_image', 'update')
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductImageDto: UpdateProductImageDto,
  ) {
    const result = await this.productImageService.update(
      id,
      updateProductImageDto,
    );
    return {
      success: true,
      message: 'Product image updated successfully',
      data: result,
    };
  }

  @RequireResource('product_image', 'delete')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.productImageService.remove(id);
    return {
      success: true,
      message: 'Product image deleted successfully',
    };
  }

  @RequireResource('product_image', 'manage')
  @Patch(':id/restore')
  @HttpCode(HttpStatus.OK)
  async restore(@Param('id', ParseIntPipe) id: number) {
    const result = await this.productImageService.restore(id);
    return {
      success: true,
      message: 'Product image restored successfully',
      data: result,
    };
  }

  // Product-specific endpoints
  @Public()
  @Get('product/:productId')
  async findByProduct(@Param('productId', ParseIntPipe) productId: number) {
    const result = await this.productImageService.findByProduct(productId);
    return {
      success: true,
      message: 'Product images retrieved successfully',
      data: result,
    };
  }

  @Public()
  @Get('product/:productId/primary')
  async findPrimaryImage(@Param('productId', ParseIntPipe) productId: number) {
    const result = await this.productImageService.findPrimaryImage(productId);
    return {
      success: true,
      message: 'Primary product image retrieved successfully',
      data: result,
    };
  }

  @RequireResource('product_image', 'update')
  @Patch(':id/set-primary')
  async setPrimary(@Param('id', ParseIntPipe) id: number) {
    const result = await this.productImageService.setPrimary(id);
    return {
      success: true,
      message: 'Image set as primary successfully',
      data: result,
    };
  }

  @RequireResource('product_image', 'update')
  @Patch('product/:productId/reorder')
  async reorderImages(
    @Param('productId', ParseIntPipe) productId: number,
    @Body('imageIds') imageIds: number[],
  ) {
    const result = await this.productImageService.reorderImages(
      productId,
      imageIds,
    );
    return {
      success: true,
      message: 'Images reordered successfully',
      data: result,
    };
  }

  // Utility endpoints
  @Public()
  @Get('product/:productId/count')
  async getImagesCount(@Param('productId', ParseIntPipe) productId: number) {
    const result = await this.productImageService.getImagesCount(productId);
    return {
      success: true,
      message: 'Images count retrieved successfully',
      data: { count: result },
    };
  }
}
