import { Body, Controller, Post } from '@nestjs/common';
import { CustomerAuthService } from '../service/customer-auth.service';
import { CustomerRegisterDto } from '../dto/customer-register.dto';
import { CustomerLoginDto } from '../dto/customer-login.dto';
import { CustomerAuthResponseDto } from '../dto/customer-auth-response.dto';
import { Public } from 'src/core/auth/decorator/auth.decorator';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller({ path: 'auth/customer', version: '1' })
export class CustomerAuthController {
  constructor(private customerAuthService: CustomerAuthService) {}

  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Register new customer account' })
  @ApiResponse({
    status: 201,
    description: 'Customer registered successfully',
    schema: {
      properties: {
        tokens: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
            tokenType: { type: 'string', example: 'Bearer' },
            expiresIn: { type: 'number' },
          },
        },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            email: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            phone: { type: 'string' },
            rewardPoints: { type: 'number' },
            tier: { type: 'string' },
          },
        },
        userType: { type: 'string', example: 'customer' },
      },
    },
  })
  async register(
    @Body() dto: CustomerRegisterDto,
  ): Promise<CustomerAuthResponseDto> {
    return this.customerAuthService.register(dto);
  }

  @Post('login')
  @Public()
  @ApiOperation({ summary: 'Customer login' })
  @ApiResponse({
    status: 200,
    description: 'Customer logged in successfully',
    schema: {
      properties: {
        tokens: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
            tokenType: { type: 'string', example: 'Bearer' },
            expiresIn: { type: 'number' },
          },
        },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            email: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            phone: { type: 'string' },
            rewardPoints: { type: 'number' },
            tier: { type: 'string' },
          },
        },
        userType: { type: 'string', example: 'customer' },
      },
    },
  })
  async login(@Body() dto: CustomerLoginDto): Promise<CustomerAuthResponseDto> {
    return this.customerAuthService.login(dto);
  }
}
