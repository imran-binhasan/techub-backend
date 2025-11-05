import {
  Body,
  Controller,
  Post,
  Get,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiConsumes, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CustomerProfileService } from '../service/customer-profile.service';
import { CurrentUser } from 'src/core/auth/decorator/current-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { CustomerProfileDto } from '../dto/customer-profile.dto';
import type { AuthenticatedUser } from 'src/core/auth/interface/auth-user.interface';

@Controller({ path: 'customer/profile', version: '1' })
export class CustomerProfileController {
  constructor(private profileService: CustomerProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Get customer profile' })
  @ApiResponse({
    status: 200,
    description: 'Customer profile retrieved successfully',
  })
  async getProfile(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CustomerProfileDto> {
    return this.profileService.getProfile(user.id);
  }

  @Put()
  @ApiOperation({ summary: 'Update customer profile' })
  @ApiResponse({
    status: 200,
    description: 'Customer profile updated successfully',
  })
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: Partial<CustomerProfileDto>,
  ): Promise<CustomerProfileDto> {
    return this.profileService.updateProfile(user.id, dto);
  }

  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload profile image' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 200,
    schema: { type: 'object', properties: { url: { type: 'string' } } },
  })
  async uploadImage(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ url: string }> {
    // TODO: Implement image upload service method
    return { url: 'https://example.com/profile-image.jpg' };
  }
}
