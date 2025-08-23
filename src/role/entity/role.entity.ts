import { Admin } from "src/admin/entity/admin.entity";
import { Base } from "src/common/entity/base.entity";
import { Permission } from "src/permission/entity/permission.entity";
import { Column, Entity, JoinTable, ManyToMany, OneToMany } from "typeorm";

@Entity('role')
export class Role extends Base{
    @Column()
    name: string;

    @Column({ nullable: true })
    description?: string;

    @OneToMany(() => Admin, admin => admin.role)
    admins: Admin[]

    @ManyToMany(() => Permission)
    @JoinTable({
        name: 'role_permission',
        joinColumn: { name: 'roleId', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'permissionId', referencedColumnName: 'id' }
    })
    permissions: Permission[]
}