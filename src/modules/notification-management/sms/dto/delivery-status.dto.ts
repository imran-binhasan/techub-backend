import { IsNotEmpty, IsString } from 'class-validator';

export class DeliveryStatusDto {
  @IsNotEmpty()
  @IsString()
  message_id: string;

  @IsNotEmpty()
  @IsString()
  status: string;
}
