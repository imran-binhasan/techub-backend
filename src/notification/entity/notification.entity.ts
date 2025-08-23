import { Base } from "src/common/entity/base.entity";
import { Customer } from "src/customer/entity/customer.entity";
import { Column, Entity, ManyToOne } from "typeorm";


@Entity('notification')
export class Notification extends Base {
    @Column()
    title:string;

    @Column()
    description:string;

    @ManyToOne(()=> Customer, customer => customer.notifications)
    customer:Customer;
}