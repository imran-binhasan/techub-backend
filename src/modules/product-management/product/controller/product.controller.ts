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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { ProductService } from '../service/product.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import {
  RequirePermissions,
  RequireResource,
  Public,
} from 'src/core/auth/decorator/auth.decorator';
import { ProductQueryDto } from '../dto/query-product.dto';

@ApiTags('Products')
@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @ApiOperation({
    summary: 'Create a new product',
    description:
      'Creates a new product with auto-generated SKU and slug if not provided. Requires product:create permission.',
  })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully',
    schema: {
      example: {
        success: true,
        message: 'Product created successfully',
        data: {
          id: 1,
          name: 'Premium Wireless Headphones',
          sku: 'CAT1-PREMIUM-ABC123',
          slug: 'premium-wireless-headphones',
          price: 149.99,
          stock: 50,
          status: 'active',
          condition: 'new',
          visibility: 'public',
          isFeatured: false,
          isPublished: true,
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({
    status: 409,
    description: 'Product with same name/SKU/slug already exists',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiBearerAuth()
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

  @ApiOperation({
    summary: 'Get all products with filtering',
    description:
      'Retrieves paginated list of products with advanced filtering options (category, brand, price range, status, etc.)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10, max: 100)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by name or description',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    type: Number,
    description: 'Filter by category ID',
  })
  @ApiQuery({
    name: 'brandId',
    required: false,
    type: Number,
    description: 'Filter by brand ID',
  })
  @ApiQuery({
    name: 'minPrice',
    required: false,
    type: Number,
    description: 'Minimum price',
  })
  @ApiQuery({
    name: 'maxPrice',
    required: false,
    type: Number,
    description: 'Maximum price',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['draft', 'active', 'inactive', 'out_of_stock', 'discontinued'],
    description: 'Product status',
  })
  @ApiQuery({
    name: 'condition',
    required: false,
    enum: [
      'new',
      'refurbished',
      'used_like_new',
      'used_good',
      'used_acceptable',
    ],
    description: 'Product condition',
  })
  @ApiQuery({
    name: 'inStock',
    required: false,
    type: Boolean,
    description: 'Filter by stock availability',
  })
  @ApiResponse({
    status: 200,
    description: 'Products retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'Products retrieved successfully',
        data: {
          items: [
            {
              id: 1,
              name: 'Premium Wireless Headphones',
              sku: 'CAT1-PREMIUM-ABC123',
              slug: 'premium-wireless-headphones',
              price: 149.99,
              stock: 50,
              status: 'active',
              avgRating: 4.5,
              reviewCount: 128,
            },
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 156,
            totalPages: 16,
          },
        },
      },
    },
  })
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

  @ApiOperation({
    summary: 'Get product by ID',
    description:
      'Retrieves a single product with all details including category, brand, images, and attributes',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Product ID' })
  @ApiResponse({
    status: 200,
    description: 'Product retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'Product retrieved successfully',
        data: {
          id: 1,
          name: 'Premium Wireless Headphones',
          description:
            'High-quality wireless headphones with noise cancellation',
          sku: 'CAT1-PREMIUM-ABC123',
          slug: 'premium-wireless-headphones',
          price: 149.99,
          compareAtPrice: 199.99,
          stock: 50,
          status: 'active',
          condition: 'new',
          avgRating: 4.5,
          reviewCount: 128,
          viewCount: 1523,
          salesCount: 89,
          category: { id: 1, name: 'Electronics' },
          brand: { id: 5, name: 'AudioTech' },
          images: [],
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
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

  @ApiOperation({
    summary: 'Update product',
    description:
      'Updates product details. All fields are optional. Requires product:update permission.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - name/SKU/slug already exists',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiBearerAuth()
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

  @ApiOperation({
    summary: 'Delete product (soft delete)',
    description:
      'Soft deletes a product. Can be restored later. Requires product:delete permission.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Product ID' })
  @ApiResponse({ status: 204, description: 'Product deleted successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiBearerAuth()
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

  @ApiOperation({
    summary: 'Restore deleted product',
    description:
      'Restores a soft-deleted product. Requires product:manage permission.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product restored successfully' })
  @ApiResponse({ status: 400, description: 'Product is not deleted' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiBearerAuth()
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

  @ApiOperation({
    summary: 'Update product stock',
    description:
      'Updates only the stock quantity of a product. Requires product:update permission.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Product ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        stock: {
          type: 'number',
          example: 100,
          description: 'New stock quantity',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Stock updated successfully' })
  @ApiResponse({ status: 400, description: 'Stock cannot be negative' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiBearerAuth()
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

  // NEW ENDPOINTS - Featured, Popular, Trending
  @ApiOperation({
    summary: 'Get featured products',
    description:
      'Retrieves featured products (products marked as featured and published)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of products (default: 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'Featured products retrieved successfully',
  })
  @Public()
  @Get('featured/list')
  async getFeatured(@Query('limit') limit?: number) {
    const result = await this.productService.getFeaturedProducts(limit);
    return {
      success: true,
      message: 'Featured products retrieved successfully',
      data: result,
    };
  }

  @ApiOperation({
    summary: 'Get popular products',
    description: 'Retrieves most viewed products',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of products (default: 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'Popular products retrieved successfully',
  })
  @Public()
  @Get('popular/list')
  async getPopular(@Query('limit') limit?: number) {
    const result = await this.productService.getPopularProducts(limit);
    return {
      success: true,
      message: 'Popular products retrieved successfully',
      data: result,
    };
  }

  @ApiOperation({
    summary: 'Get trending products',
    description: 'Retrieves trending products based on recent sales and views',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of products (default: 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'Trending products retrieved successfully',
  })
  @Public()
  @Get('trending/list')
  async getTrending(@Query('limit') limit?: number) {
    const result = await this.productService.getTrendingProducts(limit);
    return {
      success: true,
      message: 'Trending products retrieved successfully',
      data: result,
    };
  }

  @ApiOperation({
    summary: 'Search products',
    description:
      'Full-text search across product name, description, SKU, and keywords',
  })
  @ApiQuery({
    name: 'q',
    required: true,
    type: String,
    description: 'Search term',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum results (default: 20)',
  })
  @ApiResponse({
    status: 200,
    description: 'Search results retrieved successfully',
  })
  @Public()
  @Get('search')
  async search(@Query('q') searchTerm: string, @Query('limit') limit?: number) {
    const result = await this.productService.searchProducts(searchTerm, limit);
    return {
      success: true,
      message: 'Search results retrieved successfully',
      data: result,
    };
  }

  @ApiOperation({
    summary: 'Get product by slug',
    description:
      'Retrieves product by SEO-friendly slug. Increments view count automatically.',
  })
  @ApiParam({
    name: 'slug',
    type: String,
    description: 'Product slug',
    example: 'premium-wireless-headphones',
  })
  @ApiResponse({ status: 200, description: 'Product retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @Public()
  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    const result = await this.productService.findBySlug(slug);
    return {
      success: true,
      message: 'Product retrieved successfully',
      data: result,
    };
  }

  @ApiOperation({
    summary: 'Get product by SKU',
    description: 'Retrieves product by unique SKU identifier',
  })
  @ApiParam({
    name: 'sku',
    type: String,
    description: 'Product SKU',
    example: 'CAT1-PREMIUM-ABC123',
  })
  @ApiResponse({ status: 200, description: 'Product retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @Public()
  @Get('sku/:sku')
  async findBySKU(@Param('sku') sku: string) {
    const result = await this.productService.findBySKU(sku);
    return {
      success: true,
      message: 'Product retrieved successfully',
      data: result,
    };
  }

  @ApiOperation({
    summary: 'Get related products',
    description: 'Retrieves related products based on same category',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Product ID' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum results (default: 6)',
  })
  @ApiResponse({
    status: 200,
    description: 'Related products retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @Public()
  @Get(':id/related')
  async getRelated(
    @Param('id', ParseIntPipe) id: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.productService.getRelatedProducts(id, limit);
    return {
      success: true,
      message: 'Related products retrieved successfully',
      data: result,
    };
  }

  // Utility endpoints
  @ApiOperation({
    summary: 'Get products by category',
    description: 'Retrieves all products in a specific category',
  })
  @ApiParam({ name: 'categoryId', type: Number, description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
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

  @ApiOperation({
    summary: 'Get products by brand',
    description: 'Retrieves all products from a specific brand',
  })
  @ApiParam({ name: 'brandId', type: Number, description: 'Brand ID' })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
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

  // Statistics endpoints
  @ApiOperation({
    summary: 'Get total products count',
    description:
      'Returns total number of products. Requires read:product permission.',
  })
  @ApiResponse({ status: 200, description: 'Count retrieved successfully' })
  @ApiBearerAuth()
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

  @ApiOperation({
    summary: 'Get low stock products',
    description:
      'Retrieves products with stock below threshold. Requires read:product permission.',
  })
  @ApiQuery({
    name: 'threshold',
    required: false,
    type: Number,
    description: 'Stock threshold (default: 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'Low stock products retrieved successfully',
  })
  @ApiBearerAuth()
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

  // Cache management endpoint
  @ApiOperation({
    summary: 'Warm up product cache',
    description:
      'Pre-loads frequently accessed products into cache (featured, popular, trending). Requires manage:product permission.',
  })
  @ApiResponse({ status: 200, description: 'Cache warmed up successfully' })
  @ApiBearerAuth()
  @RequireResource('product', 'manage')
  @Post('cache/warm-up')
  @HttpCode(HttpStatus.OK)
  async warmUpCache() {
    await this.productService.warmUpCache();
    return {
      success: true,
      message: 'Product cache warmed up successfully',
    };
  }
}
