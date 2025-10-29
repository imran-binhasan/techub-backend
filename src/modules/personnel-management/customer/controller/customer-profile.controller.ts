import { Body, Controller, Post, UploadedFile, UseInterceptors } from "@nestjs/common";

import { ApiConsumes, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { CustomerProfileService } from "../service/customer-profile.service";
import { CurrentUser } from "src/core/auth/decorator/current-user.decorator";
import { FileInterceptor } from "@nestjs/platform-express";

@Controller({ path: 'customer/profile', version: '1' })


export class CustomerProfileController {
  constructor(private profileService: CustomerProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Get customer profile' })
  @ApiResponse({ status: 200, type: CustomerProfileDto })
  async getProfile(
    @CurrentUser() user: AuthenticatedCustomer,
  ): Promise<CustomerProfileDto> {
    return this.profileService.getProfile(user.id);
  }

  @Put()
  @ApiOperation({ summary: 'Update customer profile' })
  @ApiResponse({ status: 200, type: CustomerProfileDto })
  async updateProfile(
    @CurrentUser() user: AuthenticatedCustomer,
    @Body() dto: UpdateCustomerProfileDto,
  ): Promise<CustomerProfileDto> {
    return this.profileService.updateProfile(user.id, dto);
  }

  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload profile image' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, schema: { type: 'object', properties: { url: { type: 'string' } } } })
  async uploadImage(
    @CurrentUser() user: AuthenticatedCustomer,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ url: string }> {
    const url = await this.profileService.uploadProfileImage(user.id, file);
    return { url };
  }
}