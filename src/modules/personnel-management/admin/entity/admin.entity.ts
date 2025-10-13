import { BaseEntity } from 'src/shared/entity/base.entity';
import { Column, Entity, OneToOne, JoinColumn, Index, DeleteDateColumn } from 'typeorm';
import { User } from '../../user/entity/user.entity';

@Entity('admin')
@Index(['user_id'], { unique: true })
export class Admin extends BaseEntity {

  

  @OneToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'department', type: 'varchar', length: 100, nullable: true })
  department?: string;

  @Column({ name: 'employee_number', type: 'varchar', length: 50, nullable: true, unique: true })
  employeeNumber?: string;

  @DeleteDateColumn()
  deletedAt?: Date;
}