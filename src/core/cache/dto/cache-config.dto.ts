import {
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { CacheStrategy, CachePriority } from '../enum/cache.enum';

/**
 * DTO for cache configuration
 */
export class CacheConfigDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  ttl?: number;

  @IsOptional()
  @IsString()
  prefix?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsEnum(CacheStrategy)
  strategy?: CacheStrategy;

  @IsOptional()
  @IsEnum(CachePriority)
  priority?: CachePriority;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxSize?: number;
}

/**
 * DTO for cache statistics request
 */
export class CacheStatsDto {
  @IsOptional()
  @IsString()
  domain?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  startTime?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  endTime?: number;
}

/**
 * DTO for cache warming request
 */
export class CacheWarmingDto {
  @IsString()
  domain: string;

  @IsArray()
  @IsString({ each: true })
  keys: string[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  ttl?: number;
}

/**
 * DTO for cache invalidation request
 */
export class CacheInvalidationDto {
  @IsOptional()
  @IsString()
  domain?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keys?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  pattern?: string;
}
