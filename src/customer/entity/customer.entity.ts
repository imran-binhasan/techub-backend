import { Address } from "src/address/entity/address.entity";
import { Column, DeleteDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('customer')
export class Customer {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    firstName:string;

    @Column()
    lastName:string;

    @Column({ unique: true })
    email:string;

    @Column({ nullable: true })
    phone:string;

    @Column({ select: false })
    password:string;

    @Column({ nullable: true })
    image?:string;

    @OneToMany(()=> Address, (address) => address.customer)
    addresses: Address[];

    @DeleteDateColumn({ nullable: true })
    deletedAt: Date;
}