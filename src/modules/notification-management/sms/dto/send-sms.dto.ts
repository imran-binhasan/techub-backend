import {
  IsNotEmpty,
  IsString,
  Length,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class SendSmsDto {
  @IsNotEmpty()
  @IsString()
  @Length(11, 20, {
    message: 'Phone number must be between 11 and 20 characters',
  })
  recipient: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(500, { message: 'Message cannot exceed 500 characters' })
  message: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Reference cannot exceed 100 characters' })
  reference?: string;
}
