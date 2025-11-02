import { Body, Controller, Post } from '@nestjs/common';
import { CustomerAuthService } from 'src/modules/personnel-management/customer/service/customer-auth.service';
import { CustomerOAuthService } from 'src/modules/personnel-management/customer/service/customer-oauth.service';
import { VendorAuthService } from 'src/modules/personnel-management/vendor/service/vendor-auth.service';
import { AdminAuthService } from 'src/modules/personnel-management/admin/service/admin-auth.service';
import { CustomerRegisterDto } from 'src/modules/personnel-management/customer/dto/customer-register.dto';
import { CustomerLoginDto } from 'src/modules/personnel-management/customer/dto/customer-login.dto';
import { VendorRegisterDto } from 'src/modules/personnel-management/vendor/dto/vendor-register.dto';
import { VendorLoginDto } from 'src/modules/personnel-management/vendor/dto/vendor-login.dto';
import { AdminRegisterDto } from 'src/modules/personnel-management/admin/dto/admin-register.dto';
import { AdminLoginDto } from 'src/modules/personnel-management/admin/dto/admin-login.dto';
import { TokenService } from '../service/token-service';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private readonly customerAuthService: CustomerAuthService,
    private readonly customerOAuthService: CustomerOAuthService,
    private readonly vendorAuthService: VendorAuthService,
    private readonly adminAuthService: AdminAuthService,
    private readonly tokenService: TokenService,
  ) {}

  // ========== CUSTOMER ==========
  @Post('customer/register')
  registerCustomer(@Body() dto: CustomerRegisterDto) {
    return this.customerAuthService.register(dto);
  }

  @Post('customer/login')
  loginCustomer(@Body() dto: CustomerLoginDto) {
    return this.customerAuthService.login(dto);
  }

  @Post('customer/google')
  async googleAuth(@Body('idToken') idToken: string) {
    return this.customerOAuthService.googleAuth(idToken);
  }

  @Post('customer/facebook')
  async facebookAuth(@Body('accessToken') accessToken: string) {
    return this.customerOAuthService.facebookAuth(accessToken);
  }

  @Post('customer/forgot-password')
  async customerForgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.customerAuthService.forgotPassword(dto.email);
  }

  @Post('customer/reset-password')
  async customerResetPassword(@Body() dto: ResetPasswordDto) {
    return this.customerAuthService.resetPassword(dto.token, dto.password);
  }

  // ========== VENDOR ==========
  @Post('vendor/register')
  registerVendor(@Body() dto: VendorRegisterDto) {
    return this.vendorAuthService.register(dto);
  }

  @Post('vendor/login')
  loginVendor(@Body() dto: VendorLoginDto) {
    return this.vendorAuthService.login(dto);
  }

  @Post('vendor/forgot-password')
  async vendorForgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.vendorAuthService.forgotPassword(dto.email);
  }

  @Post('vendor/reset-password')
  async vendorResetPassword(@Body() dto: ResetPasswordDto) {
    return this.vendorAuthService.resetPassword(dto.token, dto.password);
  }

  // ========== ADMIN ==========
  @Post('admin/register')
  registerAdmin(@Body() dto: AdminRegisterDto) {
    return this.adminAuthService.register(dto);
  }

  @Post('admin/login')
  loginAdmin(@Body() dto: AdminLoginDto) {
    return this.adminAuthService.login(dto);
  }

  // Note: Admin password reset is intentionally disabled for security.
  // Admins must contact a super-admin for password reset to prevent
  // unauthorized access via compromised email accounts.

  // ========== REFRESH TOKEN ==========
  @Post('refresh')
  async refreshToken(@Body() dto: RefreshTokenDto) {
    const payload = this.tokenService.verifyRefreshToken(dto.refreshToken);
    
    // Generate new token pair
    const tokens = this.tokenService.generateTokenPair({
      sub: payload.sub,
      email: payload.email,
      type: payload.type,
      ...(payload.type === 'admin' && {
        roleId: payload.roleId,
        permissions: payload.permissions,
      }),
    });

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenType: 'Bearer',
      expiresIn: tokens.expires_in,
    };
  }
}
