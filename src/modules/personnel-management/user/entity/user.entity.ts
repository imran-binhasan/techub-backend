import { BaseEntity } from 'src/shared/entity/base.entity';
import {
  Column,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  Index,
} from 'typeorm';
import { Role } from '../../role/entity/role.entity';
import { Admin } from '../../admin/entity/admin.entity';
import { Customer } from '../../customer/entity/customer.entity';
import { Vendor } from '../../vendor/entity/vendor.entity';


@Entity('user')
@Index(['email'])
export class User extends BaseEntity {
  @Column({ name: 'first_name', type: 'varchar', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', type: 'varchar', length: 100 })
  lastName: string;

  @Column({ name: 'email', type: 'varchar', length: 255, unique: true })
  @Index()
  email: string;

  @Column({ name: 'password', type: 'text', select: false })
  password: string;

  @Column({ name: 'phone', type: 'varchar', length: 20, nullable: true })
  phone?: string;

  @Column({ name: 'image', type: 'varchar', length: 500, nullable: true })
  image?: string;;

  @ManyToOne(() => Role, (role) => role.users, {
    eager: false,
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Column({ name: 'role_id', type: 'int' })
  roleId: number;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt?: Date;

  @Column({ name: 'failed_login_attempts', type: 'integer', default: 0 })
  failedLoginAttempts: number;

  @OneToOne(() => Customer, (customer) => customer.user)
  customer?: Customer;

  @OneToOne(() => Admin, (admin) => admin.user)
  admin?: Admin;

  @OneToOne(() => Vendor, (vendor) => vendor.user)
  vendor?: Vendor;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt?: Date;

  getUserType(): 'admin' | 'customer' | 'vendor' | null {
    if (this.admin) return 'admin';
    if (this.customer) return 'customer';
    if (this.vendor) return 'vendor';
    return null;
  }
}