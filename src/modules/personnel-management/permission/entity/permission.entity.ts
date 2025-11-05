import { BaseEntity } from 'src/shared/entity/base.entity';
import { Column, Entity, Index, ManyToMany } from 'typeorm';
import { Role } from '../../role/entity/role.entity';

@Entity('permission')
@Index(['resource', 'action', 'scope'], { unique: true })
export class Permission extends BaseEntity {
  @Column({ name: 'resource', type: 'varchar', length: 100 })
  resource: string; // 'product', 'order', 'user', 'vendor', 'attendance'

  @Column({ name: 'action', type: 'varchar', length: 50 })
  action: string; // 'create', 'read', 'update', 'delete', 'manage'

  @Column({
    name: 'scope',
    type: 'enum',
    enum: ['all', 'own', 'department', 'assigned'],
    default: 'own',
  })
  scope: 'all' | 'own' | 'department' | 'assigned'; // Scope of permission

  @Column({ name: 'display_name', type: 'varchar', length: 150 })
  displayName: string; // 'Create Product', 'Manage Orders', 'View Own Reports'

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[];
}
