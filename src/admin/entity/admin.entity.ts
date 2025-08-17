import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

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

   @CreateDateColumn()
   createdAt:Date;

   @UpdateDateColumn()
   updatedAt:Date
}