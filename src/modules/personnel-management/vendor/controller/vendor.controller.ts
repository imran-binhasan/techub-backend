import { Controller, Get, Put, Post, UseGuards, Req, Body } from '@nestjs/common';
import { VendorService } from '../service/vendor.service';
import { UpdateVendorDto } from '../dto/update-vendor.dto';


@Controller('api/v1/vendors')

export class VendorController {
  constructor(private vendorService: VendorService) {}

  @Get('profile')
  getProfile(@Req() req) {
    return this.vendorService.getProfile(req.user.id);
  }

  @Put('profile')
  updateProfile(@Req() req, @Body() dto: UpdateVendorDto) {
    return this.vendorService.updateProfile(req.user.id, dto);
  }

  @Get('shop')
  getShop(@Req() req) {
    return this.vendorService.getShop(req.user.id);
  }

  @Get('analytics')
  getAnalytics(@Req() req) {
    return this.vendorService.getAnalytics(req.user.id);
  }

  @Get('sales-report')
  getSalesReport(@Req() req) {
    return this.vendorService.getSalesReport(req.user.id);
  }
}
