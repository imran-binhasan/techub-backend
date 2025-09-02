import { IsOptional, IsString, IsIn } from 'class-validator';
import { PaginationQuery } from 'src/common/dto/pagination_query.dto';

export class NotificationQueryDto extends PaginationQuery {
  @IsOptional()
  @IsString()
  @IsIn(['createdAt', 'updatedAt', 'title'])
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsString()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
