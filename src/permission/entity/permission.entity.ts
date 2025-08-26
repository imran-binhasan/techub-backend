import { Base } from "src/common/entity/base.entity";
import { Role } from "src/role/entity/role.entity";
import { Column, Entity, ManyToMany, Index } from "typeorm";

@Entity('permission')
@Index(['resource', 'action'], { unique: true })
export class Permission extends Base {
    @Column()
    resource: string; // e.g., 'admin', 'role', 'permission', 'dashboard'

    @Column()
    action: string; // e.g., 'create', 'read', 'update', 'delete', 'manage'

    @ManyToMany(() => Role, role => role.permissions)
    roles: Role[];
}