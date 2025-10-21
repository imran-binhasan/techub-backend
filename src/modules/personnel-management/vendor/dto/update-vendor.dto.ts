import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UpdateVendorDto {
  @IsString()
  @IsNotEmpty()
  shopName: string;

  @IsOptional()
  @IsString()
  shopDescription?: string;

  @IsOptional()
  @IsEmail()
  businessEmail?: string;
}