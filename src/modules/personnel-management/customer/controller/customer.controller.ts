
import { Controller, Get, Put, UseGuards, Req, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CustomerService } from '../service/customer.service';
import { UpdateCustomerDto } from '../dto/update-customer.dto';

@Controller('api/v1/customers')

export class CustomerController {
  constructor(private customerService: CustomerService) {}

  @Get('profile')
  getProfile(@Req() req) {
    return this.customerService.getProfile(req.user.id);
  }

  @Put('profile')
  updateProfile(@Req() req, @Body() dto: UpdateCustomerDto) {
    return this.customerService.updateProfile(req.user.id, dto);
  }

  @Get('orders')
  getOrders(@Req() req) {
    return this.customerService.getOrders(req.user.id);
  }

  @Get('wishlists')
  getWishlists(@Req() req) {
    return this.customerService.getWishlists(req.user.id);
  }
}
