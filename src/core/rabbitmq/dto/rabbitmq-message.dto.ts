import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsBoolean,
  IsObject,
  Min,
  Max,
} from 'class-validator';
import { MessagePriority, DeliveryMode } from '../enum/rabbitmq.enum';

/**
 * DTO for message payload
 */
export class MessagePayloadDto {
  @IsString()
  eventType: string;

  @IsObject()
  data: any;

  @IsOptional()
  @IsString()
  correlationId?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsNumber()
  timestamp?: number;
}

/**
 * DTO for message options
 */
export class MessageOptionsDto {
  @IsOptional()
  @IsEnum(MessagePriority)
  priority?: MessagePriority;

  @IsOptional()
  @IsEnum(DeliveryMode)
  deliveryMode?: DeliveryMode;

  @IsOptional()
  @IsNumber()
  @Min(0)
  expiration?: number;

  @IsOptional()
  @IsString()
  correlationId?: string;

  @IsOptional()
  @IsString()
  replyTo?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  delay?: number;

  @IsOptional()
  @IsBoolean()
  persistent?: boolean;
}

/**
 * DTO for queue configuration
 */
export class QueueConfigDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsBoolean()
  durable?: boolean;

  @IsOptional()
  @IsBoolean()
  exclusive?: boolean;

  @IsOptional()
  @IsBoolean()
  autoDelete?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  maxRetries?: number;

  @IsOptional()
  @IsNumber()
  @Min(100)
  retryDelay?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  messageTtl?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxLength?: number;
}

/**
 * DTO for consumer configuration
 */
export class ConsumerConfigDto {
  @IsString()
  queueName: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  prefetchCount?: number;

  @IsOptional()
  @IsBoolean()
  noAck?: boolean;

  @IsOptional()
  @IsBoolean()
  exclusive?: boolean;

  @IsOptional()
  @IsString()
  consumerTag?: string;
}

/**
 * DTO for retry configuration
 */
export class RetryConfigDto {
  @IsNumber()
  @Min(1)
  @Max(10)
  maxRetries: number;

  @IsNumber()
  @Min(100)
  retryDelay: number;

  @IsOptional()
  @IsNumber()
  @Min(1.0)
  @Max(10.0)
  backoffMultiplier?: number;

  @IsOptional()
  @IsNumber()
  @Min(1000)
  maxRetryDelay?: number;
}
