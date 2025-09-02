import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from 'src/customer/entity/customer.entity';
import { AddressService } from '../service/address.service';
import { AddressController } from '../controller/address.controller';
import { Address } from '../entity/address.entity';
import { AuthModule } from 'src/auth/module/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Address, Customer]), AuthModule],
  controllers: [AddressController],
  providers: [AddressService],
  exports: [AddressService],
})
export class AddressModule {}
