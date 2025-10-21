import { IsEmail, IsOptional, IsString } from "class-validator";
import { IsNotEmpty, MinLength } from "class-validator";

export class VendorLoginDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  otpCode?: string;
}
