// src/address/dto/query-address.dto.ts
import { IsOptional, IsUUID, IsEnum, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationQuery } from 'src/common/dto/pagination_query.dto';
import { AddressType, CountryList } from '../entity/address.entity';

export class AddressQueryDto extends PaginationQuery {
  @IsOptional()
  
  customerId?: string;

  @IsOptional()
  @IsEnum(AddressType)
  type?: AddressType;

  @IsOptional()
  @IsEnum(CountryList)
  country?: CountryList;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  })
  @IsBoolean()
  isDefault?: boolean;
}
