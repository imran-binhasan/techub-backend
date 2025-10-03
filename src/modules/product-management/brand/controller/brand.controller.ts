// src/brand/controller/brand.controller.ts
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
import { BrandService } from '../service/brand.service';
import { CreateBrandDto } from '../dto/create-brand.dto';
import { UpdateBrandDto } from '../dto/update-brand.dto';
import {
  RequirePermissions,
  RequireResource,
  Public,
} from 'src/core/auth/decorator/auth.decorator';
import { PaginationQuery } from 'src/shared/dto/pagination_query.dto';

@Controller('brand')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @RequireResource('brand', 'create')
  @Post()
  @UseInterceptors(FileInterceptor('logo'))
  async create(
    @Body() createBrandDto: CreateBrandDto,
    @UploadedFile() logo?: Express.Multer.File,
  ) {
    const result = await this.brandService.create(createBrandDto, logo);
    return {
      success: true,
      message: 'Brand created successfully',
      data: result,
    };
  }

  @RequirePermissions('read:brand', 'list:brand')
  @Get()
  async findAll(@Query() query: PaginationQuery) {
    const result = await this.brandService.findAll(query);
    return {
      success: true,
      message: 'Brands retrieved successfully',
      data: result,
    };
  }

  @Public()
  @Get('all')
  async findAllWithoutPagination() {
    const result = await this.brandService.findAllWithoutPagination();
    return {
      success: true,
      message: 'All brands retrieved successfully',
      data: result,
    };
  }

  @RequireResource('brand', 'read')
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.brandService.findOne(id);
    return {
      success: true,
      message: 'Brand retrieved successfully',
      data: result,
    };
  }

  @RequireResource('brand', 'update')
  @Patch(':id')
  @UseInterceptors(FileInterceptor('logo'))
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBrandDto: UpdateBrandDto,
    @UploadedFile() logo?: Express.Multer.File,
  ) {
    const result = await this.brandService.update(id, updateBrandDto, logo);
    return {
      success: true,
      message: 'Brand updated successfully',
      data: result,
    };
  }

  @RequireResource('brand', 'delete')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.brandService.remove(id);
    return {
      success: true,
      message: 'Brand deleted successfully',
    };
  }

  @RequireResource('brand', 'manage')
  @Patch(':id/restore')
  @HttpCode(HttpStatus.OK)
  async restore(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.brandService.restore(id);
    return {
      success: true,
      message: 'Brand restored successfully',
      data: result,
    };
  }

  // Utility endpoints
  @RequireResource('brand', 'read')
  @Get(':id/products')
  async findWithProducts(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.brandService.findWithProducts(id);
    return {
      success: true,
      message: 'Brand with products retrieved successfully',
      data: result,
    };
  }

  @RequirePermissions('read:brand')
  @Get('stats/count')
  async getBrandsCount() {
    const result = await this.brandService.getBrandsCount();
    return {
      success: true,
      message: 'Brands count retrieved successfully',
      data: { count: result },
    };
  }
}
