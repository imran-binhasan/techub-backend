import { Base } from "src/common/entity/base.entity";
import { Role } from "src/role/entity/role.entity";
import { Column, Entity, JoinColumn, ManyToOne, RelationId } from "typeorm";

@Entity('admin')
export class Admin extends Base {
   @Column()
   firstName:string

   @Column()
   lastName:string;

   @Column({unique:true})
   email:string;

   @Column({select:false})
   password:string

   @Column({nullable:true})
   image?:string;

   @ManyToOne(()=> Role, role => role.admins)
   @JoinColumn({name:'roleId'})
   role:Role;

   @RelationId((admin:Admin) => admin.role)
   roleId:string
}