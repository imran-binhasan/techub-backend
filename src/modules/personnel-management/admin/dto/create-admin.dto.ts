import {
  IsOptional,
  IsString
} from 'class-validator';
import { BaseUserDto } from '../../user/dto/base-user.dto';

export class CreateAdminDto extends BaseUserDto {
  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  employeeNumber?: string;
}
