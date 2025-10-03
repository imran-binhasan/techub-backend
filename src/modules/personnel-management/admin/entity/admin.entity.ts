import { BaseEntity } from 'src/shared/entity/base.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  RelationId,
  Index,
  OneToOne,
} from 'typeorm';
import { User } from '../../user/entity/user.entity';

@Entity('admin')
export class Admin extends BaseEntity {

  @OneToOne(()=> User, {eager: true, onDelete: 'CASCADE'})
  user: User;
  
}
