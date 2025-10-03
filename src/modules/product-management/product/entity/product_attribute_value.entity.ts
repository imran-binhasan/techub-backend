import { BaseEntity } from 'src/shared/entity/base.entity';
import { Product } from './product.entity';
import { AttributeValue } from 'src/product-management/attribute_value/entity/attribute_value.entity';
import { Entity, ManyToOne, Unique } from 'typeorm';

@Entity('product_attribute_value')
export class ProductAttributeValue extends BaseEntity {
  @ManyToOne(() => Product, (product) => product.attributeValues, {
    onDelete: 'CASCADE',
  })
  product: Product;

  @ManyToOne(() => AttributeValue, (value) => value.productAttributeValues, {
    onDelete: 'CASCADE',
  })
  attributeValue: AttributeValue;
}
