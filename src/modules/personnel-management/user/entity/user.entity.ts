import { BaseEntity } from 'src/shared/entity/base.entity';
import { Column, DeleteDateColumn, Entity, OneToOne } from 'typeorm';
import { Admin } from '../../admin/entity/admin.entity';
import { Customer } from '../../customer/entity/customer.entity';
import { Vendor } from '../../vendor/entity/vendor.entity';

export enum UserType {
  CUSTOMER = 'customer',
  VENDOR = 'vendor',
  ADMIN = 'admin',
}

@Entity('user')
export class User extends BaseEntity {
  @Column({ name: 'first_name', type: 'varchar', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', type: 'varchar', length: 100 })
  lastName: string;

  @Column({
    name: 'email',
    type: 'varchar',
    length: 255,
    nullable: false,
    unique: true,
  })
  email?: string;

  @Column({ name: 'email_verified', default: false })
  emailVerified: boolean;

  @Column({ name: 'password', type: 'text', select: false })
  password: string;

  @Column({
    name: 'phone',
    type: 'varchar',
    length: 20,
    nullable: true,
    unique: true,
  })
  phone?: string;

  @Column({ name: 'image', type: 'varchar', length: 500, nullable: true })
  image?: string;

  @Column({ name:'user_type', type: 'enum', enum: UserType })
  userType: UserType;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt?: Date;

  @OneToOne(() => Customer, (customer) => customer.user, { nullable: true })
  customer?: Customer;

  @OneToOne(() => Admin, (admin) => admin.user, { nullable: true })
  admin?: Admin;

  @OneToOne(() => Vendor, (vendor) => vendor.user, { nullable: true })
  vendor?: Vendor;
}
