import { Body, Controller, Post } from "@nestjs/common";
import { CustomerAuthService } from "../service/customer-auth.service";
import { CustomerRegisterDto } from "../dto/customer-register.dto";
import { CustomerLoginDto } from "../dto/customer-login.dto";
import { Public } from "src/core/auth/decorator/auth.decorator";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";

@Controller({ path: 'auth/customer', version: '1' })
export class CustomerAuthController {
  constructor(private customerAuthService: CustomerAuthService) {}

  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Register new customer account' })
  @ApiResponse({ status: 201, type: CustomerAuthResponseDto })
  async register(
    @Body() dto: CustomerRegisterDto,
  ): Promise<CustomerAuthResponseDto> {
    return this.customerAuthService.register(dto);
  }

  @Post('login')
  @Public()
  @ApiOperation({ summary: 'Customer login' })
  @ApiResponse({ status: 200, type: CustomerAuthResponseDto })
  async login(
    @Body() dto: CustomerLoginDto,
  ): Promise<CustomerAuthResponseDto> {
    return this.customerAuthService.login(dto);
  }
}