import { IsArray, IsUUID } from 'class-validator';

export class SendNotificationDto {
  @IsArray()
  @IsUUID('4', { each: true })
  customerIds: string[];
}
