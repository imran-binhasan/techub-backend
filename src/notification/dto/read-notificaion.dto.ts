// src/notification/dto/mark-as-read.dto.ts
import { IsArray, IsUUID } from 'class-validator';

export class MarkAsReadDto {
  @IsArray()
  notificationIds: string[];
}
