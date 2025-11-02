import { IsOptional, IsString, IsDateString, IsIn } from 'class-validator';

export class UpdateCustomerProfileDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: Date;

  @IsOptional()
  @IsIn(['male', 'female', 'other', 'prefer-not-to-say'])
  gender?: string;

  @IsOptional()
  @IsIn(['en', 'bn'])
  preferredLanguage?: string;
}
