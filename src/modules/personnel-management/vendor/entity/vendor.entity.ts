import { BaseEntity } from 'src/shared/entity/base.entity';
import { Column, Entity, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../../user/entity/user.entity';

@Entity('vendor')
export class Vendor extends BaseEntity {
  @OneToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ name: 'company_name', type: 'varchar', length: 255, nullable: true })
  companyName?: string;

  @Column({ name: 'business_license', type: 'varchar', length: 255, nullable: true })
  businessLicense?: string;

  @Column({ name: 'tax_id', type: 'varchar', length: 255, nullable: true })
  taxId?: string;
}