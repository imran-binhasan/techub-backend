import { Base } from "src/common/entity/base.entity";
import { Role } from "src/role/entity/role.entity";
import { Column, Entity, ManyToMany } from "typeorm";

@Entity('permission')
export class Permission extends Base{

    @Column()
    name: string;

    @Column({ nullable: true })
    description?: string;

    @ManyToMany(() => Role, role => role.permissions)
    roles: Role[];
}