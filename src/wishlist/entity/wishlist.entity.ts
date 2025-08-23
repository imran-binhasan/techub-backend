import { Base } from "src/common/entity/base.entity";
import { Customer } from "src/customer/entity/customer.entity";
import { Entity, ManyToOne} from "typeorm";

@Entity('wishlist')
export class Wishlist extends Base {

    @ManyToOne(()=> Customer, customer => customer.wishlists, {onDelete: 'CASCADE'})
    customer:Customer;
}