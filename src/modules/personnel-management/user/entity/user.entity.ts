
import { BaseEntity } from 'src/shared/entity/base.entity';


import {
  Column,
  Entity,
} from 'typeorm';

@Entity('users')
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @Column({ type: 'varchar', length: 100 })
  lastName: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'text', select: false })
  password: string;

  @Column({ type: 'integer', default: true })
  phone: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image?: string;
}
