import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { BaseUserDto } from "../../user/dto/base-user.dto";

export class CreateVendorDto extends BaseUserDto {
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