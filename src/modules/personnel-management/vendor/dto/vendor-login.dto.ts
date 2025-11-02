import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class VendorLoginDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsString()
  otpCode?: string;
}
