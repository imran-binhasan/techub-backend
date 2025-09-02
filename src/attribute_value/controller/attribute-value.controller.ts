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

import {
  RequirePermissions,
  RequireResource,
  Public,
} from 'src/auth/decorator/auth.decorator';
import { AttributeValueService } from '../service/attribute_value.service';
import { CreateAttributeValueDto } from '../dto/create-attribute_value.dto';
import { AttributeValueQueryDto } from '../dto/query-attribute_value.dto';
import { UpdateAttributeValueDto } from '../dto/update-attribute_value.dto';

@Controller('attribute-value')
export class AttributeValueController {
  constructor(private readonly attributeValueService: AttributeValueService) {}

  @RequireResource('attribute_value', 'create')
  @Post()
  async create(@Body() createAttributeValueDto: CreateAttributeValueDto) {
    const result = await this.attributeValueService.create(
      createAttributeValueDto,
    );
    return {
      success: true,
      message: 'Attribute value created successfully',
      data: result,
    };
  }

  @RequirePermissions('read:attribute_value', 'list:attribute_value')
  @Get()
  async findAll(@Query() query: AttributeValueQueryDto) {
    const result = await this.attributeValueService.findAll(query);
    return {
      success: true,
      message: 'Attribute values retrieved successfully',
      data: result,
    };
  }

  @Public()
  @Get('all')
  async findAllWithoutPagination() {
    const result = await this.attributeValueService.findAllWithoutPagination();
    return {
      success: true,
      message: 'All attribute values retrieved successfully',
      data: result,
    };
  }

  @RequireResource('attribute_value', 'read')
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.attributeValueService.findOne(id);
    return {
      success: true,
      message: 'Attribute value retrieved successfully',
      data: result,
    };
  }

  @RequireResource('attribute_value', 'update')
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAttributeValueDto: UpdateAttributeValueDto,
  ) {
    const result = await this.attributeValueService.update(
      id,
      updateAttributeValueDto,
    );
    return {
      success: true,
      message: 'Attribute value updated successfully',
      data: result,
    };
  }

  @RequireResource('attribute_value', 'delete')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.attributeValueService.remove(id);
    return {
      success: true,
      message: 'Attribute value deleted successfully',
    };
  }

  @RequireResource('attribute_value', 'manage')
  @Patch(':id/restore')
  @HttpCode(HttpStatus.OK)
  async restore(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.attributeValueService.restore(id);
    return {
      success: true,
      message: 'Attribute value restored successfully',
      data: result,
    };
  }

  // Utility endpoints
  @Public()
  @Get('attribute/:attributeId')
  async findByAttribute(
    @Param('attributeId', ParseUUIDPipe) attributeId: string,
  ) {
    const result =
      await this.attributeValueService.findByAttribute(attributeId);
    return {
      success: true,
      message: 'Attribute values by attribute retrieved successfully',
      data: result,
    };
  }

  @RequireResource('attribute_value', 'create')
  @Post('bulk/:attributeId')
  async bulkCreateForAttribute(
    @Param('attributeId', ParseUUIDPipe) attributeId: string,
    @Body('values') values: string[],
  ) {
    const result = await this.attributeValueService.bulkCreateForAttribute(
      attributeId,
      values,
    );
    return {
      success: true,
      message: 'Attribute values created successfully',
      data: result,
    };
  }

  @RequirePermissions('read:attribute_value')
  @Get('stats/count')
  async getAttributeValuesCount() {
    const result = await this.attributeValueService.getAttributeValuesCount();
    return {
      success: true,
      message: 'Attribute values count retrieved successfully',
      data: { count: result },
    };
  }
}
