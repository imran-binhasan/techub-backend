import { IsEmail, IsOptional, IsString } from "class-validator";
import { IsNotEmpty, MinLength } from "class-validator";

export class AdminLoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;

  @IsOptional()
  @IsString()
  twoFactorCode?: string; // Optional 2FA
}