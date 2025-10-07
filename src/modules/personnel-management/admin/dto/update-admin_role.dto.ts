// admin/dto/update-admin-role.dto.ts
import { IsUUID, IsNotEmpty } from 'class-validator';

export class UpdateAdminRoleDto {
  @IsNotEmpty({ message: 'Role ID is required' })
  roleId: number;
}
