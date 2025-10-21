import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from '../service/auth.service';
import { CustomerRegisterDto } from '../dto/customer-register.dto';
import { CustomerLoginDto } from '../dto/customer-login.dto';
import { VendorRegisterDto } from '../dto/vendor-register.dto';
import { VendorLoginDto } from '../dto/vendor-login.dto';
import { AdminRegisterDto } from '../dto/admin-register.dto';
import { AdminLoginDto } from '../dto/admin-login.dto';


@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private authService: AuthService) {}

  // ========== CUSTOMER ==========
  @Post('customer/register')
  registerCustomer(@Body() dto: CustomerRegisterDto) {
    return this.authService.registerCustomer(dto);
  }

  @Post('customer/login')
  loginCustomer(@Body() dto: CustomerLoginDto) {
    return this.authService.loginCustomer(dto);
  }

  @Post('customer/send-otp')
  sendCustomerOtp(@Body('phone') phone: string) {
    return this.authService.sendOtp(phone, 'CUSTOMER');
  }

  // ========== VENDOR ==========
  @Post('vendor/register')
  registerVendor(@Body() dto: VendorRegisterDto) {
    return this.authService.registerVendor(dto);
  }

  @Post('vendor/login')
  loginVendor(@Body() dto: VendorLoginDto) {
    return this.authService.loginVendor(dto);
  }

  @Post('vendor/send-otp')
  sendVendorOtp(@Body('phone') phone: string) {
    return this.authService.sendOtp(phone, 'VENDOR');
  }

  // ========== ADMIN ==========
  @Post('admin/register')
  registerAdmin(@Body() dto: AdminRegisterDto) {
    return this.authService.registerAdmin(dto);
  }

  @Post('admin/login')
  loginAdmin(@Body() dto: AdminLoginDto) {
    return this.authService.loginAdmin(dto);
  }
}
