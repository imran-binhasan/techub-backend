import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

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
  twoFactorCode?: string;
}
