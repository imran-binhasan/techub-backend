import { Base } from "src/common/entity/base.entity";
import { Admin } from "src/admin/entity/admin.entity";
import { Permission } from "src/permission/entity/permission.entity";
import { Column, Entity, OneToMany, ManyToMany, JoinTable } from "typeorm";

@Entity('role')
export class Role extends Base {
    @Column({ unique: true })
    name: string;

    @Column({ nullable: true })
    description?: string;

    @Column({ default: true })
    isActive: boolean;

    @OneToMany(() => Admin, admin => admin.role)
    admins: Admin[];

    @ManyToMany(() => Permission, permission => permission.roles, { eager: false })
    @JoinTable({
        name: 'role_permissions',
        joinColumn: { name: 'roleId', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'permissionId', referencedColumnName: 'id' }
    })
    permissions: Permission[];
}