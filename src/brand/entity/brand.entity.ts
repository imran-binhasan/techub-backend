import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('brand')
export class Brand {
    @PrimaryGeneratedColumn('uuid')
    id:string;

    @Column()
    name:string;
}