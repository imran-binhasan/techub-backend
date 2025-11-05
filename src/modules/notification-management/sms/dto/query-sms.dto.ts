import {
  IsOptional,
  IsString,
  IsBoolean,
  IsDateString,
  IsIn,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PaginationQuery } from 'src/shared/dto/pagination_query.dto';

export class SmsQueryDto extends PaginationQuery {
  @IsOptional()
  @IsString()
  @IsIn(['pending', 'sent', 'delivered', 'failed'])
  status?: string;

  @IsOptional()
  @IsString()
  recipient?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  })
  @IsBoolean()
  delivered?: boolean;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  @IsIn(['createdAt', 'updatedAt', 'status', 'recipient', 'deliveredAt'])
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsString()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
