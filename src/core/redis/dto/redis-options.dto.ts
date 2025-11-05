import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';

/**
 * DTO for Redis cache options
 */
export class RedisCacheOptionsDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  ttl?: number;

  @IsOptional()
  @IsBoolean()
  nx?: boolean; // Only set if key doesn't exist

  @IsOptional()
  @IsBoolean()
  xx?: boolean; // Only set if key exists
}

/**
 * DTO for Redis lock options
 */
export class RedisLockOptionsDto {
  @IsNumber()
  @Min(1)
  @Max(300)
  ttl: number;

  @IsOptional()
  @IsString()
  identifier?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  maxRetries?: number;

  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(1000)
  retryDelayMs?: number;
}

/**
 * DTO for Redis pipeline batch
 */
export class RedisPipelineBatchDto {
  @IsString()
  operation: string;

  @IsString()
  key: string;

  @IsOptional()
  value?: any;

  @IsOptional()
  @IsNumber()
  ttl?: number;
}

/**
 * DTO for Redis connection configuration
 */
export class RedisConnectionConfigDto {
  @IsString()
  host: string;

  @IsNumber()
  @Min(1)
  @Max(65535)
  port: number;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(15)
  db?: number;

  @IsOptional()
  @IsNumber()
  @Min(1000)
  connectionTimeout?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxRetriesPerRequest?: number;
}
