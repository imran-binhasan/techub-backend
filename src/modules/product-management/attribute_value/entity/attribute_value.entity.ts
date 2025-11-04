import { BaseEntity } from 'src/shared/entity/base.entity';
import { Column, Entity, ManyToOne, OneToMany, Unique, DeleteDateColumn } from 'typeorm';
import { Attribute } from '../../attribute/entity/attribute.entity';
import { ProductAttributeValue } from '../../product/entity/product_attribute_value.entity';

@Entity('attribute_value')
export class AttributeValue extends BaseEntity {
  @Column({ length: 255 })
  value: string; // e.g. "Red", "XL", "Cotton"

  @ManyToOne(() => Attribute, (attribute) => attribute.values, {
    onDelete: 'CASCADE',
  })
  attribute: Attribute;

  @OneToMany(() => ProductAttributeValue, (pav) => pav.attributeValue)
  productAttributeValues: ProductAttributeValue[];

}
