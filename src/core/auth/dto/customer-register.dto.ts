import { IsOptional, IsString } from "class-validator";
import { BaseRegisterDto } from "./base-register.dto";

export class CustomerRegisterDto extends BaseRegisterDto {
  @IsOptional()
  @IsString()
  preferredLanguage?: string;
}