// src/attribute/controller/attribute.controller.ts
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
  ParseUUIDPipe,
} from '@nestjs/common';
import { AttributeService } from '../service/attribute.service';
import { CreateAttributeDto } from '../dto/create-attribute.dto';
import { UpdateAttributeDto } from '../dto/update-attribute.dto';
import {
  RequirePermissions,
  RequireResource,
  Public,
} from 'src/auth/decorator/auth.decorator';
import { PaginationQuery } from 'src/common/dto/pagination_query.dto';


@Controller('attribute')
export class AttributeController {
  constructor(private readonly attributeService: AttributeService) {}

  @RequireResource('attribute', 'create')
  @Post()
  async create(@Body() createAttributeDto: CreateAttributeDto) {
    const result = await this.attributeService.create(createAttributeDto);
    return {
      success: true,
      message: 'Attribute created successfully',
      data: result,
    };
  }

  @RequirePermissions('read:attribute', 'list:attribute')
  @Get()
  async findAll(@Query() query: PaginationQuery) {
    const result = await this.attributeService.findAll(query);
    return {
      success: true,
      message: 'Attributes retrieved successfully',
      data: result,
    };
  }

  @Public()
  @Get('all')
  async findAllWithoutPagination() {
    const result = await this.attributeService.findAllWithoutPagination();
    return {
      success: true,
      message: 'All attributes retrieved successfully',
      data: result,
    };
  }

  @RequireResource('attribute', 'read')
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.attributeService.findOne(id);
    return {
      success: true,
      message: 'Attribute retrieved successfully',
      data: result,
    };
  }

  @RequireResource('attribute', 'update')
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAttributeDto: UpdateAttributeDto,
  ) {
    const result = await this.attributeService.update(id, updateAttributeDto);
    return {
      success: true,
      message: 'Attribute updated successfully',
      data: result,
    };
  }

  @RequireResource('attribute', 'delete')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.attributeService.remove(id);
    return {
      success: true,
      message: 'Attribute deleted successfully',
    };
  }

  @RequireResource('attribute', 'manage')
  @Patch(':id/restore')
  @HttpCode(HttpStatus.OK)
  async restore(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.attributeService.restore(id);
    return {
      success: true,
      message: 'Attribute restored successfully',
      data: result,
    };
  }

  // Utility endpoints
  @Public()
  @Get('type/:type')
  async findByType(@Param('type') type: string) {
    const result = await this.attributeService.findByType(type);
    return {
      success: true,
      message: 'Attributes by type retrieved successfully',
      data: result,
    };
  }

  @RequirePermissions('read:attribute')
  @Get('stats/count')
  async getAttributesCount() {
    const result = await this.attributeService.getAttributesCount();
    return {
      success: true,
      message: 'Attributes count retrieved successfully',
      data: { count: result },
    };
  }
}