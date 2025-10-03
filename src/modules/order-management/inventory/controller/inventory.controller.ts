// src/inventory/controller/inventory.controller.ts
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
import { InventoryService } from '../service/inventory.service';
import { CreateInventoryDto } from '../dto/create-inventory.dto';
import { UpdateInventoryDto } from '../dto/update-inventory.dto';
import { StockAdjustmentDto } from '../dto/stock-adjustment.dto';

import {
  RequirePermissions,
  RequireResource,
  Public,
} from 'src/core/auth/decorator/auth.decorator';
import { InventoryQueryDto } from '../dto/query-inventory.dto';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @RequireResource('inventory', 'create')
  @Post()
  async create(@Body() createInventoryDto: CreateInventoryDto) {
    const result = await this.inventoryService.create(createInventoryDto);
    return {
      success: true,
      message: 'Inventory created successfully',
      data: result,
    };
  }

  @RequirePermissions('read:inventory')
  @Get()
  async findAll(@Query() query: InventoryQueryDto) {
    const result = await this.inventoryService.findAll(query);
    return {
      success: true,
      message: 'Inventory items retrieved successfully',
      data: result,
    };
  }

  @RequirePermissions('read:inventory')
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.inventoryService.findOne(id);
    return {
      success: true,
      message: 'Inventory item retrieved successfully',
      data: result,
    };
  }

  @RequireResource('inventory', 'update')
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateInventoryDto: UpdateInventoryDto,
  ) {
    const result = await this.inventoryService.update(id, updateInventoryDto);
    return {
      success: true,
      message: 'Inventory updated successfully',
      data: result,
    };
  }

  @RequireResource('inventory', 'update')
  @Patch(':id/adjust-stock')
  async adjustStock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() adjustmentDto: StockAdjustmentDto,
  ) {
    const result = await this.inventoryService.adjustStock(id, adjustmentDto);
    return {
      success: true,
      message: 'Stock adjusted successfully',
      data: result,
    };
  }

  @RequireResource('inventory', 'delete')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.inventoryService.remove(id);
    return {
      success: true,
      message: 'Inventory deleted successfully',
    };
  }

  // Utility endpoints
  @RequirePermissions('read:inventory')
  @Get('product/:productId')
  async findByProduct(@Param('productId', ParseUUIDPipe) productId: string) {
    const result = await this.inventoryService.findByProductId(productId);
    return {
      success: true,
      message: 'Inventory for product retrieved successfully',
      data: result,
    };
  }

  @RequirePermissions('read:inventory')
  @Get('reports/low-stock')
  async getLowStockItems(@Query('threshold') threshold?: number) {
    const result = await this.inventoryService.getLowStockItems(threshold);
    return {
      success: true,
      message: 'Low stock items retrieved successfully',
      data: result,
    };
  }

  @RequirePermissions('read:inventory')
  @Get('reports/stats')
  async getStats() {
    const result = await this.inventoryService.getInventoryStats();
    return {
      success: true,
      message: 'Inventory statistics retrieved successfully',
      data: result,
    };
  }
}
