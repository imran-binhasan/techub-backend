// ===== ADMIN CONTROLLER =====

// admin/controller/admin.controller.ts
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
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminService } from '../service/admin.service';
import { CreateAdminDto } from '../dto/create-admin.dto';
import {
  AdminOnly,
  RequirePermissions,
  RequireResource,
} from 'src/core/auth/decorator/auth.decorator';
import type { AuthenticatedUser } from 'src/core/auth/interface/auth-user.interface';
import { UpdateAdminDto } from '../dto/update-admin.dto';
import { UpdateAdminRoleDto } from '../dto/update-admin_role.dto';
import { CurrentUser } from 'src/core/auth/decorator/current-user.decorator';
import { PaginationQuery } from 'src/shared/dto/pagination_query.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @RequireResource('admin', 'create')
  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @Body() createAdminDto: CreateAdminDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    const result = await this.adminService.create(createAdminDto, image);
    return {
      success: true,
      message: 'Admin created successfully',
      data: result,
    };
  }

  @RequirePermissions('read:admin', 'list:admin')
  @Get()
  async findAll(
    @Query() query: PaginationQuery & { isActive?: boolean; roleId?: string },
  ) {
    const result = await this.adminService.findAll(query);
    return {
      success: true,
      message: 'Admins retrieved successfully',
      data: result,
    };
  }

  @RequireResource('admin', 'read')
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const result = await this.adminService.findOne(id);
    return {
      success: true,
      message: 'Admin retrieved successfully',
      data: result,
    };
  }

  @RequireResource('admin', 'update')
  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAdminDto: UpdateAdminDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    const result = await this.adminService.update(id, updateAdminDto, image);
    return {
      success: true,
      message: 'Admin updated successfully',
      data: result,
    };
  }

  @RequireResource('admin', 'manage')
  @Patch(':id/role')
  async updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAdminRoleDto: UpdateAdminRoleDto,
  ) {
    const result = await this.adminService.updateRole(
      id,
      updateAdminRoleDto.roleId,
    );
    return {
      success: true,
      message: 'Admin role updated successfully',
      data: result,
    };
  }

  @RequireResource('admin', 'manage')
  @Patch(':id/toggle-status')
  @HttpCode(HttpStatus.OK)
  async toggleStatus(@Param('id', ParseIntPipe) id: number) {
    const result = await this.adminService.toggleStatus(id);
    return {
      success: true,
      message: `Admin status ${result.isActive ? 'activated' : 'deactivated'} successfully`,
      data: result,
    };
  }

  @RequireResource('admin', 'delete')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.adminService.softDelete(id);
    return {
      success: true,
      message: 'Admin deleted successfully',
    };
  }

  @RequireResource('admin', 'manage')
  @Patch(':id/restore')
  @HttpCode(HttpStatus.OK)
  async restore(@Param('id', ParseIntPipe) id: number) {
    const result = await this.adminService.restore(id);
    return {
      success: true,
      message: 'Admin restored successfully',
      data: result,
    };
  }

  // Self-management endpoints
  @AdminOnly()
  @Get('profile/me')
  async getMyProfile(@CurrentUser() user: AuthenticatedUser) {
    const result = await this.adminService.findOne(user.id);
    return {
      success: true,
      message: 'Profile retrieved successfully',
      data: result,
    };
  }

  @AdminOnly()
  @Patch('profile/me')
  @UseInterceptors(FileInterceptor('image'))
  async updateMyProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateAdminDto: Omit<UpdateAdminDto, 'isActive'>,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    const result = await this.adminService.update(
      user.id,
      updateAdminDto,
      image,
    );
    return {
      success: true,
      message: 'Profile updated successfully',
      data: result,
    };
  }
}
