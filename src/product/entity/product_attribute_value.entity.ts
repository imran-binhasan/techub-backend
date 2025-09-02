import { Base } from 'src/common/entity/base.entity';
import { Product } from './product.entity';
import { AttributeValue } from 'src/attribute_value/entity/attribute_value.entity';
import { Entity, ManyToOne, Unique } from 'typeorm';

@Entity('product_attribute_value')
export class ProductAttributeValue extends Base {
  @ManyToOne(() => Product, (product) => product.attributeValues, {
    onDelete: 'CASCADE',
  })
  product: Product;

  @ManyToOne(() => AttributeValue, (value) => value.productAttributeValues, {
    onDelete: 'CASCADE',
  })
  attributeValue: AttributeValue;
}
