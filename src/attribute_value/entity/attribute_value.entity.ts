import { Base } from 'src/common/entity/base.entity';
import { Attribute } from 'src/attribute/entity/attribute.entity';
import { Column, Entity, ManyToOne, OneToMany, Unique } from 'typeorm';
import { ProductAttributeValue } from 'src/product/entity/product_attribute_value.entity';

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
