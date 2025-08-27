// admin/dto/update-admin-role.dto.ts
import { IsUUID, IsNotEmpty } from 'class-validator';

export class UpdateAdminRoleDto {
  @IsUUID(4, { message: 'Role ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Role ID is required' })
  roleId: string;
}