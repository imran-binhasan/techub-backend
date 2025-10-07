// src/category/controller/category.controller.ts
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
import { CategoryService } from '../service/category.service';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import {
  RequirePermissions,
  RequireResource,
  Public,
} from 'src/core/auth/decorator/auth.decorator';
import { CategoryQueryDto } from '../dto/query-category.dto';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @RequireResource('category', 'create')
  @Post()
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    const result = await this.categoryService.create(createCategoryDto);
    return {
      success: true,
      message: 'Category created successfully',
      data: result,
    };
  }

  @RequirePermissions('read:category', 'list:category')
  @Get()
  async findAll(@Query() query: CategoryQueryDto) {
    const result = await this.categoryService.findAll(query);
    return {
      success: true,
      message: 'Categories retrieved successfully',
      data: result,
    };
  }

  @Public()
  @Get('all')
  async findAllWithoutPagination() {
    const result = await this.categoryService.findAllWithoutPagination();
    return {
      success: true,
      message: 'All categories retrieved successfully',
      data: result,
    };
  }

  @Public()
  @Get('tree')
  async getCategoryTree() {
    const result = await this.categoryService.getCategoryTree();
    return {
      success: true,
      message: 'Category tree retrieved successfully',
      data: result,
    };
  }

  @Public()
  @Get('root')
  async getRootCategories() {
    const result = await this.categoryService.getRootCategories();
    return {
      success: true,
      message: 'Root categories retrieved successfully',
      data: result,
    };
  }

  @RequireResource('category', 'read')
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const result = await this.categoryService.findOne(id);
    return {
      success: true,
      message: 'Category retrieved successfully',
      data: result,
    };
  }

  @RequireResource('category', 'update')
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    const result = await this.categoryService.update(id, updateCategoryDto);
    return {
      success: true,
      message: 'Category updated successfully',
      data: result,
    };
  }

  @RequireResource('category', 'delete')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.categoryService.remove(id);
    return {
      success: true,
      message: 'Category deleted successfully',
    };
  }

  @RequireResource('category', 'manage')
  @Patch(':id/restore')
  @HttpCode(HttpStatus.OK)
  async restore(@Param('id', ParseIntPipe) id: number) {
    const result = await this.categoryService.restore(id);
    return {
      success: true,
      message: 'Category restored successfully',
      data: result,
    };
  }

  // Utility endpoints
  @Public()
  @Get(':id/children')
  async getChildCategories(@Param('id', ParseIntPipe) id: number) {
    const result = await this.categoryService.getChildCategories(id);
    return {
      success: true,
      message: 'Child categories retrieved successfully',
      data: result,
    };
  }

  @RequireResource('category', 'read')
  @Get(':id/products')
  async findWithProducts(@Param('id', ParseIntPipe) id: number) {
    const result = await this.categoryService.findWithProducts(id);
    return {
      success: true,
      message: 'Category with products retrieved successfully',
      data: result,
    };
  }

  @RequirePermissions('read:category')
  @Get('stats/count')
  async getCategoriesCount() {
    const result = await this.categoryService.getCategoriesCount();
    return {
      success: true,
      message: 'Categories count retrieved successfully',
      data: { count: result },
    };
  }
}
