// src/cart/controller/cart.controller.ts
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
  BadRequestException,
} from '@nestjs/common';
import {
  RequirePermissions,
  RequireResource,
  CustomerOnly,
} from 'src/core/auth/decorator/auth.decorator';
import { CurrentUser } from 'src/core/auth/decorator/current-user.decorator';
import type { AuthenticatedUser } from 'src/core/auth/interface/auth-user.interface';
import { CartService } from '../service/cart.service';
import { CreateCartDto } from '../dto/create-cart.dto';
import { UpdateCartDto } from '../dto/update-cart.dto';
import { CartQueryDto } from '../dto/query-cart.dto';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  // Customer endpoints
  @CustomerOnly()
  @Post()
  async addToCart(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createCartDto: CreateCartDto,
  ) {
    const result = await this.cartService.addToCart(user.id, createCartDto);
    return {
      success: true,
      message: 'Item added to cart successfully',
      data: result,
    };
  }

  @CustomerOnly()
  @Get('my-cart')
  async getMyCart(@CurrentUser() user: AuthenticatedUser) {
    const result = await this.cartService.findByCustomer(user.id);
    return {
      success: true,
      message: 'Cart items retrieved successfully',
      data: result,
    };
  }

  @CustomerOnly()
  @Get('my-cart/total')
  async getMyCartTotal(@CurrentUser() user: AuthenticatedUser) {
    const result = await this.cartService.getCartTotal(user.id);
    return {
      success: true,
      message: 'Cart total retrieved successfully',
      data: result,
    };
  }

  @CustomerOnly()
  @Get('my-cart/count')
  async getMyCartItemsCount(@CurrentUser() user: AuthenticatedUser) {
    const result = await this.cartService.getCartItemsCount(user.id);
    return {
      success: true,
      message: 'Cart items count retrieved successfully',
      data: { count: result },
    };
  }

  @CustomerOnly()
  @Patch(':id/quantity')
  async updateMyCartItemQuantity(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() updateCartDto: UpdateCartDto,
  ) {
    // First verify the cart item belongs to the current user
    const cartItem = await this.cartService.findOne(id);
    if (cartItem.customerId !== user.id) {
      throw new BadRequestException('You can only update your own cart items');
    }

    const result = await this.cartService.updateQuantity(id, updateCartDto);
    return {
      success: true,
      message: 'Cart item quantity updated successfully',
      data: result,
    };
  }

  @CustomerOnly()
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeFromMyCart(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    // First verify the cart item belongs to the current user
    const cartItem = await this.cartService.findOne(id);
    if (cartItem.customerId !== user.id) {
      throw new BadRequestException('You can only remove your own cart items');
    }

    await this.cartService.remove(id);
    return {
      success: true,
      message: 'Item removed from cart successfully',
    };
  }

  @CustomerOnly()
  @Delete('clear/my-cart')
  @HttpCode(HttpStatus.NO_CONTENT)
  async clearMyCart(@CurrentUser() user: AuthenticatedUser) {
    await this.cartService.clearCart(user.id);
    return {
      success: true,
      message: 'Cart cleared successfully',
    };
  }

  @CustomerOnly()
  @Patch('bulk-update')
  async bulkUpdateMyCartQuantities(
    @CurrentUser() user: AuthenticatedUser,
    @Body('updates') updates: { id: string; quantity: number }[],
  ) {
    // Verify all cart items belong to the current user
    for (const update of updates) {
      const cartItem = await this.cartService.findOne(update.id);
      if (cartItem.customerId !== user.id) {
        throw new BadRequestException(
          'You can only update your own cart items',
        );
      }
    }

    const result = await this.cartService.bulkUpdateQuantities(updates);
    return {
      success: true,
      message: 'Cart items updated successfully',
      data: result,
    };
  }

  // Admin endpoints for cart management
  @RequirePermissions('read:cart', 'list:cart')
  @Get()
  async findAll(@Query() query: CartQueryDto) {
    const result = await this.cartService.findAll(query);
    return {
      success: true,
      message: 'Cart items retrieved successfully',
      data: result,
    };
  }

  @RequireResource('cart', 'read')
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.cartService.findOne(id);
    return {
      success: true,
      message: 'Cart item retrieved successfully',
      data: result,
    };
  }

  @RequireResource('cart', 'read')
  @Get('customer/:customerId')
  async findByCustomer(@Param('customerId') customerId: string) {
    const result = await this.cartService.findByCustomer(customerId);
    return {
      success: true,
      message: 'Customer cart items retrieved successfully',
      data: result,
    };
  }

  @RequireResource('cart', 'update')
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCartDto: UpdateCartDto,
  ) {
    const result = await this.cartService.updateQuantity(id, updateCartDto);
    return {
      success: true,
      message: 'Cart item updated successfully',
      data: result,
    };
  }

  @RequireResource('cart', 'delete')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.cartService.remove(id);
    return {
      success: true,
      message: 'Cart item deleted successfully',
    };
  }

  @RequireResource('cart', 'manage')
  @Delete('customer/:customerId/clear')
  @HttpCode(HttpStatus.NO_CONTENT)
  async clearCustomerCart(
    @Param('customerId') customerId: string,
  ) {
    await this.cartService.clearCart(customerId);
    return {
      success: true,
      message: 'Customer cart cleared successfully',
    };
  }

  // Utility endpoints
  @RequireResource('cart', 'read')
  @Get('customer/:customerId/total')
  async getCustomerCartTotal(
    @Param('customerId') customerId: string,
  ) {
    const result = await this.cartService.getCartTotal(customerId);
    return {
      success: true,
      message: 'Customer cart total retrieved successfully',
      data: result,
    };
  }

  @RequireResource('cart', 'manage')
  @Post('move/:fromCustomerId/to/:toCustomerId')
  async moveCart(
    @Param('fromCustomerId') fromCustomerId: string,
    @Param('toCustomerId') toCustomerId: string,
  ) {
    const result = await this.cartService.moveToCart(
      toCustomerId,
      fromCustomerId,
    );
    return {
      success: true,
      message: 'Cart items moved successfully',
      data: result,
    };
  }
}
