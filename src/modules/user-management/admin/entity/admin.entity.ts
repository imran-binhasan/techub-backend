// admin/entity/admin.entity.ts
import { BaseEntity } from 'src/shared/entity/base.entity';
import { Role } from 'src/user-management/role/entity/role.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  RelationId,
  Index,
} from 'typeorm';

@Entity('admin')
export class Admin extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @Column({ type: 'varchar', length: 100 })
  lastName: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'text', select: false })
  password: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image?: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ManyToOne(() => Role, (role) => role.admins, {
    eager: false,
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @RelationId((admin: Admin) => admin.role)
  @Column({ type: 'uuid' })
  roleId: string;
}
