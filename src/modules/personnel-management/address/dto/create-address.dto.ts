
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
  IsBoolean,
} from 'class-validator';
import { AddressType } from '../entity/address.entity';

export class CreateAddressDto {
  
  @IsNotEmpty()
  customerId: number;

  @IsString()
  @IsNotEmpty()
  street: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsString()
  addressLine?: string;

  @IsEnum(AddressType)
  type: AddressType;


  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
