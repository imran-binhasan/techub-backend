
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
export class Role extends BaseEntity {
  @Column()
  resource: string; // e.g., 'admin', 'manager', 'user'

  @Column()
  action: string; // e.g., 'super', 'limited', 'read-only'

  @OneToMany(() => User, (user) => user.role)
  users: User[];

  @ManyToMany(() => Permission, (permission) => permission.roles, {
    eager: false,
  })
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'roleId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permissionId', referencedColumnName: 'id' },
  })
  permissions: Permission[];
}
