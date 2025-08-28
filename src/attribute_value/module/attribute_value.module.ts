// src/attribute_value/module/attribute-value.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttributeValueController } from '../controller/attribute-value.controller';
import { AttributeValue } from '../entity/attribute_value.entity';
import { Attribute } from 'src/attribute/entity/attribute.entity';
import { AttributeValueService } from '../service/attribute_value.service';
import { AuthModule } from 'src/auth/module/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([AttributeValue, Attribute]),AuthModule],
  controllers: [AttributeValueController],
  providers: [AttributeValueService],
  exports: [AttributeValueService],
})
export class AttributeValueModule {}