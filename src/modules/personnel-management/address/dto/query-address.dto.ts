
import { IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationQuery } from 'src/shared/dto/pagination_query.dto';
import { AddressType } from '../entity/address.entity';

export class AddressQueryDto extends PaginationQuery {
  @IsOptional()
  
  customerId?: number;

  @IsOptional()
  @IsEnum(AddressType)
  type?: AddressType;


  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  })
  @IsBoolean()
  isDefault?: boolean;
}
