import { IsDateString, IsEnum, IsOptional } from "class-validator";
import { BaseUserDto } from "../../user/dto/base-user.dto";

export class CreateCustomerDto extends BaseUserDto {
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsEnum(['male', 'female', 'other'])
  gender?: string;
}