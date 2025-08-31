import { Base } from "src/common/entity/base.entity";
import { Column, Entity, Index } from "typeorm";

export enum CouponType {
    PERCENTAGE = 'percentage',
    FIXED = 'fixed'
}

@Entity('coupon')
@Index(['startDate', 'endDate'])
export class Coupon extends Base {
    @Column({ type: 'varchar', length: 255 })
    name: string;

    @Column({ type: 'varchar', length: 50, unique: true })
    code: string;

    @Column({ 
        type: 'enum', 
        enum: CouponType 
    })
    couponType: CouponType;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    minPurchase: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    maxDiscountAmount: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    discountPercentage: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    discountAmount: number;

    @Column({ type: 'timestamptz' })
    startDate: Date;

    @Column({ type: 'timestamptz' })
    endDate: Date;

    @Column({ type: 'int', default: 0 })
    usageCount: number;

    @Column({ type: 'int', nullable: true })
    maxUsageLimit: number;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;
}