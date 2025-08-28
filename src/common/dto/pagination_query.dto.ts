import { Type } from "class-transformer";
import { IsOptional, IsString } from "class-validator";

export class PaginationQuery {
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;
}