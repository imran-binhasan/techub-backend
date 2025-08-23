
import { Base } from "src/common/entity/base.entity";
import { Column, Entity } from "typeorm";

export enum couponType {
    PERCENTAGE = 'percentage',
    FIXED = 'fixed'
}

@Entity('coupon')
export class Coupon extends Base{
    @Column()
    minPurchase: number;

    @Column()
    maxDiscount: number;

    @Column()
    couponType: couponType

    @Column()
    code:string

    @Column({type: 'timestamptz'})
    startDate: Date;

    @Column({type: 'timestamptz'})
    endDate: Date;
}