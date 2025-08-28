import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttributeService } from '../service/attribute.service';
import { AttributeController } from '../controller/attribute.controller';
import { Attribute } from '../entity/attribute.entity';
import { AuthModule } from 'src/auth/module/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Attribute]),AuthModule],
  controllers: [AttributeController],
  providers: [AttributeService],
  exports: [AttributeService],
})
export class AttributeModule {}