// src/notification/dto/update-notification.dto.ts
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateNotificationDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
