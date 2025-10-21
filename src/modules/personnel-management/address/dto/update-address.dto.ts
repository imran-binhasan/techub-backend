// src/address/dto/update-address.dto.ts
import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { AddressType } from '../entity/address.entity';

export class UpdateAddressDto {
  @IsOptional()
  @IsString()
  street?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsString()
  addressLine?: string;

  @IsOptional()
  @IsEnum(AddressType)
  type?: AddressType;


  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
