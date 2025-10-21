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
import { AddressService } from '../service/address.service';
import { UpdateAddressDto } from '../dto/update-address.dto';
import { RequireResource } from 'src/core/auth/decorator/auth.decorator';
import { AddressQueryDto } from '../dto/query-address.dto';
import { CreateAddressDto } from '../dto/create-address.dto';

@Controller('address')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @RequireResource('address', 'create')
  @Post()
  async create(@Body() createAddressDto: CreateAddressDto) {
    const result = await this.addressService.create(createAddressDto);
    return {
      success: true,
      message: 'Address created successfully',
      data: result,
    };
  }

  @RequireResource('address', 'read')
  @Get()
  async findAll(@Query() query: AddressQueryDto) {
    const result = await this.addressService.findAll(query);
    return {
      success: true,
      message: 'Addresses retrieved successfully',
      data: result,
    };
  }

  @RequireResource('address', 'read')
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id:number) {
    const result = await this.addressService.findOne(id);
    return {
      success: true,
      message: 'Address retrieved successfully',
      data: result,
    };
  }

  @RequireResource('address', 'update')
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id:number,
    @Body() updateAddressDto: UpdateAddressDto,
  ) {
    const result = await this.addressService.update(id, updateAddressDto);
    return {
      success: true,
      message: 'Address updated successfully',
      data: result,
    };
  }

  @RequireResource('address', 'delete')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id:number) {
    await this.addressService.remove(id);
    return {
      success: true,
      message: 'Address deleted successfully',
    };
  }

  @RequireResource('address', 'manage')
  @Patch(':id/restore')
  @HttpCode(HttpStatus.OK)
  async restore(@Param('id', ParseIntPipe) id:number) {
    const result = await this.addressService.restore(id);
    return {
      success: true,
      message: 'Address restored successfully',
      data: result,
    };
  }

  // Customer-specific endpoints
  @RequireResource('address', 'read')
  @Get('customer/:customerId')
  async findByCustomer(@Param('customerId', ParseIntPipe) customerId:number) {
    const result = await this.addressService.findByCustomer(customerId);
    return {
      success: true,
      message: 'Customer addresses retrieved successfully',
      data: result,
    };
  }

  @RequireResource('address', 'read')
  @Get('customer/:customerId/default')
  async findDefaultAddress(
    @Param('customerId', ParseIntPipe) customerId:number,
  ) {
    const result = await this.addressService.findDefaultAddress(customerId);
    return {
      success: true,
      message: 'Default address retrieved successfully',
      data: result,
    };
  }

  @RequireResource('address', 'update')
  @Patch(':id/set-default')
  async setAsDefault(@Param('id', ParseIntPipe) id:number) {
    const result = await this.addressService.setAsDefault(id);
    return {
      success: true,
      message: 'Address set as default successfully',
      data: result,
    };
  }

  // Utility endpoints
  @RequireResource('address', 'read')
  @Get('customer/:customerId/count')
  async getAddressesCount(
    @Param('customerId', ParseIntPipe) customerId:number,
  ) {
    const result = await this.addressService.getAddressesCount(customerId);
    return {
      success: true,
      message: 'Address count retrieved successfully',
      data: { count: result },
    };
  }
}
