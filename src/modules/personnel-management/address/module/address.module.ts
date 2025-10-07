import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AddressService } from '../service/address.service';
import { AddressController } from '../controller/address.controller';
import { Address } from '../entity/address.entity';
import { AuthModule } from 'src/core/auth/module/auth.module';
import { Customer } from '../../customer/entity/customer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Address, Customer]), AuthModule],
  controllers: [AddressController],
  providers: [AddressService],
  exports: [AddressService],
})
export class AddressModule {}
