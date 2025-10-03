import { IsArray, IsUUID } from 'class-validator';

export class SendNotificationDto {
  @IsArray()
  customerIds: string[];
}
