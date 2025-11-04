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
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
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
import { Cart } from '../entity/cart.entity';

@ApiTags('Cart')
@Controller('cart')
@ApiBearerAuth()
export class CartController {
  constructor(private readonly cartService: CartService) {}

  // Customer endpoints
  @CustomerOnly()
  @Post()
  @ApiOperation({
    summary: 'Add item to cart',
    description: 'Add a product to the authenticated customer\'s cart. If the product already exists, quantity will be increased. Cached for 5 minutes.',
  })
  @ApiBody({ type: CreateCartDto })
  @ApiResponse({
    status: 201,
    description: 'Item added to cart successfully',
    type: Cart,
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid data or insufficient stock' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Product not found' })
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
  @ApiOperation({
    summary: 'Get my cart items',
    description: 'Retrieve all items in the authenticated customer\'s cart. Cached for 5 minutes.',
  })
  @ApiResponse({
    status: 200,
    description: 'Cart items retrieved successfully',
    type: [Cart],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiOperation({
    summary: 'Get cart total',
    description: 'Calculate total price and item count for authenticated customer\'s cart. Cached for 5 minutes.',
  })
  @ApiResponse({
    status: 200,
    description: 'Cart total retrieved successfully',
    schema: {
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Cart total retrieved successfully' },
        data: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 299.99 },
            items: { type: 'number', example: 5 },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiOperation({
    summary: 'Get cart items count',
    description: 'Get the number of items in authenticated customer\'s cart. Cached for 3 minutes.',
  })
  @ApiResponse({
    status: 200,
    description: 'Cart items count retrieved successfully',
    schema: {
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Cart items count retrieved successfully' },
        data: {
          type: 'object',
          properties: {
            count: { type: 'number', example: 3 },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiOperation({
    summary: 'Update cart item quantity',
    description: 'Update quantity for a specific cart item. Invalidates all cart caches.',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Cart item ID',
    example: 1,
  })
  @ApiBody({ type: UpdateCartDto })
  @ApiResponse({
    status: 200,
    description: 'Cart item quantity updated successfully',
    type: Cart,
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Not your cart item or insufficient stock' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Cart item not found' })
  async updateMyCartItemQuantity(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: number,
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
  @ApiOperation({
    summary: 'Remove item from cart',
    description: 'Remove a specific item from authenticated customer\'s cart. Invalidates all cart caches.',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Cart item ID',
    example: 1,
  })
  @ApiResponse({ status: 204, description: 'Item removed from cart successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request - Not your cart item' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Cart item not found' })
  async removeFromMyCart(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: number,
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
  @ApiOperation({
    summary: 'Clear entire cart',
    description: 'Remove all items from authenticated customer\'s cart. Invalidates all cart caches.',
  })
  @ApiResponse({ status: 204, description: 'Cart cleared successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
    @Body('updates') updates: { id: number; quantity: number }[],
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
  @ApiOperation({
    summary: 'Get all cart items (Admin)',
    description: 'Retrieve all cart items with filtering and pagination. Requires admin permissions.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'customerId', required: false, type: Number })
  @ApiQuery({ name: 'productId', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Cart items retrieved successfully',
    type: [Cart],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires admin permissions' })
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
  async findOne(@Param('id') id: number) {
    const result = await this.cartService.findOne(id);
    return {
      success: true,
      message: 'Cart item retrieved successfully',
      data: result,
    };
  }

  @RequireResource('cart', 'read')
  @Get('customer/:customerId')
  async findByCustomer(@Param('customerId') customerId: number) {
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
    @Param('id') id: number,
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
  async remove(@Param('id') id: number) {
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
    @Param('customerId') customerId: number,
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
    @Param('customerId') customerId: number,
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
    @Param('fromCustomerId') fromCustomerId: number,
    @Param('toCustomerId') toCustomerId: number,
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
