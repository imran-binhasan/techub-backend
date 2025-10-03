import { AttributeValue } from 'src/attribute_value/entity/attribute_value.entity';
import { BaseEntity } from 'src/common/entity/base.entity';
import { Column, Entity, OneToMany } from 'typeorm';

export enum AttributeType {
  TEXT = 'text',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  SELECT = 'select',
  COLOR = 'color',
  SIZE = 'size',
}

@Entity('attribute')
export class Attribute extends BaseEntity {
  @Column({ length: 255, unique: true })
  name: string; // e.g. "Color", "Size", "Material"

  @Column({
    type: 'enum',
    enum: AttributeType,
    default: AttributeType.TEXT,
  })
  type: AttributeType;

  @OneToMany(() => AttributeValue, (value) => value.attribute, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  values: AttributeValue[];
}
