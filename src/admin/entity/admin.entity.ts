import { Role } from "src/role/entity/role.entity";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, RelationId, UpdateDateColumn } from "typeorm";

@Entity('admin')
export class Admin{
   @PrimaryGeneratedColumn('uuid')
   id:string;

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

   @CreateDateColumn()
   createdAt:Date;

   @UpdateDateColumn()
   updatedAt:Date

   @DeleteDateColumn({nullable:true})
   deletedAt:Date
}