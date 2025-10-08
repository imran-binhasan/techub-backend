import {
  Column,
  Entity,
  OneToMany,
  ManyToMany,
  JoinTable,
  Index,
} from 'typeorm';
import { BaseEntity } from 'src/shared/entity/base.entity';
import { User } from '../../user/entity/user.entity';
import { Permission } from '../../permission/entity/permission.entity';

@Entity('role')
@Index(['name'], { unique: true })
export class Role extends BaseEntity {
  @Column({ name: 'name', type: 'varchar', length: 100, unique: true })
  name: string; // 'SUPER_ADMIN', 'CUSTOMER', 'VENDOR_MANAGER'

  @Column({ name: 'display_name', type: 'varchar', length: 100 })
  displayName: string; // 'Super Admin', 'Customer', 'Vendor Manager'

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'is_system_role', type: 'boolean', default: false })
  isSystemRole: boolean; // Prevents deletion of critical roles

  @OneToMany(() => User, (user) => user.role)
  users: User[];

  @ManyToMany(() => Permission, (permission) => permission.roles, {
    eager: false,
  })
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissions: Permission[];
}