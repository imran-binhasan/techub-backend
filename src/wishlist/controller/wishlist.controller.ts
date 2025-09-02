import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Patch,
} from '@nestjs/common';
import { WishlistService } from '../service/wishlist.service';
import { CreateWishlistDto } from '../dto/create-wishlist.dto';
import { UpdateWishlistDto } from '../dto/update-wishlist.dto';
import { RequireResource, Public } from 'src/auth/decorator/auth.decorator';
import { WishlistQueryDto } from '../dto/query-wishlist.dto';

@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @RequireResource('wishlist', 'create')
  @Post()
  async create(@Body() createWishlistDto: CreateWishlistDto) {
    const result = await this.wishlistService.create(createWishlistDto);
    return {
      success: true,
      message: 'Item added to wishlist successfully',
      data: result,
    };
  }

  @RequireResource('wishlist', 'update')
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateWishlistDto: UpdateWishlistDto,
  ) {
    const result = await this.wishlistService.update(id, updateWishlistDto);
    return {
      success: true,
      message: 'Wishlist item updated successfully',
      data: result,
    };
  }

  @RequireResource('wishlist', 'read')
  @Get()
  async findAll(@Query() query: WishlistQueryDto) {
    const result = await this.wishlistService.findAll(query);
    return {
      success: true,
      message: 'Wishlist items retrieved successfully',
      data: result,
    };
  }

  @RequireResource('wishlist', 'read')
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.wishlistService.findOne(id);
    return {
      success: true,
      message: 'Wishlist item retrieved successfully',
      data: result,
    };
  }

  @RequireResource('wishlist', 'delete')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.wishlistService.remove(id);
    return {
      success: true,
      message: 'Item removed from wishlist successfully',
    };
  }

  @RequireResource('wishlist', 'manage')
  @Patch(':id/restore')
  @HttpCode(HttpStatus.OK)
  async restore(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.wishlistService.restore(id);
    return {
      success: true,
      message: 'Wishlist item restored successfully',
      data: result,
    };
  }

  // Customer-specific endpoints
  @RequireResource('wishlist', 'read')
  @Get('customer/:customerId')
  async findByCustomer(@Param('customerId', ParseUUIDPipe) customerId: string) {
    const result = await this.wishlistService.findByCustomerId(customerId);
    return {
      success: true,
      message: 'Customer wishlist retrieved successfully',
      data: result,
    };
  }

  @RequireResource('wishlist', 'delete')
  @Delete('customer/:customerId/product/:productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeByCustomerAndProduct(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    await this.wishlistService.removeByCustomerAndProduct(
      customerId,
      productId,
    );
    return {
      success: true,
      message: 'Item removed from wishlist successfully',
    };
  }

  @RequireResource('wishlist', 'delete')
  @Delete('customer/:customerId/clear')
  @HttpCode(HttpStatus.NO_CONTENT)
  async clearCustomerWishlist(
    @Param('customerId', ParseUUIDPipe) customerId: string,
  ) {
    await this.wishlistService.clearCustomerWishlist(customerId);
    return {
      success: true,
      message: 'Wishlist cleared successfully',
    };
  }

  // Utility endpoints
  @RequireResource('wishlist', 'read')
  @Get('customer/:customerId/count')
  async getWishlistCount(
    @Param('customerId', ParseUUIDPipe) customerId: string,
  ) {
    const result = await this.wishlistService.getWishlistCount(customerId);
    return {
      success: true,
      message: 'Wishlist count retrieved successfully',
      data: { count: result },
    };
  }

  @RequireResource('wishlist', 'read')
  @Get('customer/:customerId/product/:productId/check')
  async isProductInWishlist(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    const result = await this.wishlistService.isProductInWishlist(
      customerId,
      productId,
    );
    return {
      success: true,
      message: 'Product wishlist status retrieved successfully',
      data: { inWishlist: result },
    };
  }
}
