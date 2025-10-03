import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
} from '@nestjs/common';
import { Public, Auth } from '../decorator/auth.decorator';
import type { AuthenticatedUser } from '../interface/auth-user.interface';
import { AuthService } from '../service/auth-service';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { CurrentUser } from '../decorator/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  async adminLogin(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto, 'admin');
    return {
      success: true,
      message: 'Admin login successful',
      data: result,
    };
  }

  @Public()
  @Post('customer/login')
  @HttpCode(HttpStatus.OK)
  async customerLogin(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto, 'customer');
    return {
      success: true,
      message: 'Customer login successful',
      data: result,
    };
  }

  @Public()
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    const result = await this.authService.refreshToken(refreshTokenDto);
    return {
      success: true,
      message: 'Token refreshed successfully',
      data: result,
    };
  }

  @Auth()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser() user: AuthenticatedUser) {
    await this.authService.logout(user.id);
    return {
      success: true,
      message: 'Logout successful',
    };
  }

  @Auth()
  @Get('profile')
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    return {
      success: true,
      message: 'Profile retrieved successfully',
      data: user,
    };
  }
}
