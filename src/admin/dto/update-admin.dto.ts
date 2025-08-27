
// admin/dto/update-admin.dto.ts
import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateAdminDto } from './create-admin.dto';
import { IsOptional, MinLength } from 'class-validator';

export class UpdateAdminDto extends PartialType(
  OmitType(CreateAdminDto, ['roleId'] as const)
) {
  @IsOptional()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password?: string;
}
