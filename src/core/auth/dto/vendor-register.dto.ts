import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { BaseRegisterDto } from "./base-register.dto";

export class VendorRegisterDto extends BaseRegisterDto {
  @IsString()
  @IsNotEmpty()
  shopName: string;

  @IsString()
  @IsNotEmpty()
  shopSlug: string;

  @IsOptional()
  @IsString()
  shopDescription?: string;

  @IsOptional()
  @IsString()
  businessEmail?: string;

  @IsOptional()
  @IsString()
  businessPhone?: string;
}