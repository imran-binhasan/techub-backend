import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CustomerService } from '../service/customer.service';
import { 
  AdminOnly, 
  CustomerOnly,
  RequirePermissions, 
  RequireResource,
  Public
} from 'src/auth/decorator/auth.decorator';
import type { AuthenticatedUser } from 'src/auth/interface/auth-user.interface';
import { PaginationQuery } from 'src/common/interface/api-response.interface';
import { CreateCustomerDto } from '../dto/create-customer.dto';
import { UpdateCustomerDto } from '../dto/update-customer.dto';
import { CurrentUser } from 'src/auth/decorator/current-user.decorator';

@Controller('customer')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  // Public registration endpoint
  @Public()
  @Post('register')
  @UseInterceptors(FileInterceptor('image'))
  async register(
    @Body() createCustomerDto: CreateCustomerDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    const result = await this.customerService.create(createCustomerDto, image);
    return {
      success: true,
      message: 'Customer registered successfully',
      data: result,
    };
  }

  // Admin-only endpoints for customer management
  @RequireResource('customer', 'create')
  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @Body() createCustomerDto: CreateCustomerDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    const result = await this.customerService.create(createCustomerDto, image);
    return {
      success: true,
      message: 'Customer created successfully',
      data: result,
    };
  }

  @RequirePermissions('read:customer', 'list:customer')
  @Get()
  async findAll(@Query() query: PaginationQuery & { isActive?: boolean }) {
    const result = await this.customerService.findAll(query);
    return {
      success: true,
      message: 'Customers retrieved successfully',
      data: result,
    };
  }

  @RequireResource('customer', 'read')
  @Get('admin/:id')
  async findOneByAdmin(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.customerService.findOne(id);
    return {
      success: true,
      message: 'Customer retrieved successfully',
      data: result,
    };
  }

  @RequireResource('customer', 'update')
  @Patch('admin/:id')
  @UseInterceptors(FileInterceptor('image'))
  async updateByAdmin(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    const result = await this.customerService.update(id, updateCustomerDto, image);
    return {
      success: true,
      message: 'Customer updated successfully',
      data: result,
    };
  }

  @RequireResource('customer', 'manage')
  @Patch('admin/:id/toggle-status')
  @HttpCode(HttpStatus.OK)
  async toggleStatusByAdmin(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.customerService.toggleStatus(id);
    return {
      success: true,
      message: `Customer status ${result.isActive ? 'activated' : 'deactivated'} successfully`,
      data: result,
    };
  }

  @RequireResource('customer', 'delete')
  @Delete('admin/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeByAdmin(@Param('id', ParseUUIDPipe) id: string) {
    await this.customerService.softDelete(id);
    return {
      success: true,
      message: 'Customer deleted successfully',
    };
  }

  @RequireResource('customer', 'manage')
  @Patch('admin/:id/restore')
  @HttpCode(HttpStatus.OK)
  async restoreByAdmin(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.customerService.restore(id);
    return {
      success: true,
      message: 'Customer restored successfully',
      data: result,
    };
  }

  // Customer self-management endpoints
  @CustomerOnly()
  @Get('profile')
  async getMyProfile(@CurrentUser() user: AuthenticatedUser) {
    const result = await this.customerService.findOne(user.id);
    return {
      success: true,
      message: 'Profile retrieved successfully',
      data: result,
    };
  }

  @CustomerOnly()
  @Patch('profile')
  @UseInterceptors(FileInterceptor('image'))
  async updateMyProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateCustomerDto: Omit<UpdateCustomerDto, 'isActive'>,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    const result = await this.customerService.update(user.id, updateCustomerDto, image);
    return {
      success: true,
      message: 'Profile updated successfully',
      data: result,
    };
  }

  @CustomerOnly()
  @Delete('profile')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deactivateMyAccount(@CurrentUser() user: AuthenticatedUser) {
    await this.customerService.softDelete(user.id);
    return {
      success: true,
      message: 'Account deactivated successfully',
    };
  }
}

