import { Customer } from "src/customer/entity/customer.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

export enum CountryList {
      BANGLADESH = "bangladesh",
      GERMANY = "germany",
      USA = "united_states",
      CANADA = "canada",
}

@Entity('address')
export class Address {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    street: string;

    @Column()
    city: string;

    @Column({nullable:true})
    state: string;

    @Column({nullable: true})
    postalCode: string;

    @Column({nullable:true})
    addressLine: string;

    @Column({type:"enum", enum: CountryList})
    country:CountryList;

    @ManyToOne(()=> Customer, (customer) => customer.addresses)
    customer: Customer;
}