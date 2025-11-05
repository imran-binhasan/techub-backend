import { IsEmail, IsString, IsOptional, MinLength } from 'class-validator';

export class SendEmailDto {
  @IsEmail()
  recipient: string;

  @IsString()
  @MinLength(1)
  subject: string;

  @IsString()
  @MinLength(1)
  body: string;

  @IsOptional()
  @IsString()
  htmlBody?: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  attachments?: any;
}
