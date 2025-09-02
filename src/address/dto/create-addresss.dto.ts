// src/address/dto/create-address.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
  IsBoolean,
} from 'class-validator';
import { AddressType, CountryList } from '../entity/address.entity';

export class CreateAddressDto {
  @IsUUID()
  @IsNotEmpty()
  customerId: string;

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

  @IsEnum(CountryList)
  country: CountryList;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
