import { BaseEntity } from 'src/shared/entity/base.entity';
import { Column, Entity, Index, ManyToMany } from 'typeorm';
import { Role } from '../../role/entity/role.entity';

@Entity('permission')
export class Permission extends BaseEntity {
  @Column()
  resource: string; // e.g., 'admin', 'role', 'permission', 'dashboard'

  @Column()
  action: string; // e.g., 'create', 'read', 'update', 'delete', 'manage'

  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[];
}
