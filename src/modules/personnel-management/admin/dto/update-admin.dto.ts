import { IsOptional, MinLength } from 'class-validator';

export class UpdateAdminDto  {
  @IsOptional()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password?: string;
}
