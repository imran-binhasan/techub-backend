import { IsOptional, IsString } from 'class-validator';
import { BaseRegisterDto } from './base-register.dto';

export class AdminRegisterDto extends BaseRegisterDto {
  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  employeeNumber?: string;
}
