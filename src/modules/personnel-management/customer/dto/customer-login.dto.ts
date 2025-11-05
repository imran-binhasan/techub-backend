import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CustomerLoginDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  googleToken?: string;

  @IsOptional()
  @IsString()
  otpCode?: string;
}
