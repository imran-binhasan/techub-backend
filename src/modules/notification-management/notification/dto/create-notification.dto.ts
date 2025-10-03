import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  description: string;
}
