import { Injectable, Inject, Logger } from '@nestjs/common';
import Redis from 'ioredis';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  nx?: boolean; // Only set if key doesn't exist
}

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  // Basic operations
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      this.logger.error(`Failed to get key ${key}:`, error);
      return null;
    }
  }

  async set<T = any>(
    key: string,
    value: T,
    options?: CacheOptions,
  ): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);

      if (options?.ttl) {
        if (options.nx) {
          const result = await this.redis.set(
            key,
            serialized,
            'EX',
            options.ttl,
            'NX',
          );
          return result === 'OK';
        }
        await this.redis.setex(key, options.ttl, serialized);
      } else {
        if (options?.nx) {
          const result = await this.redis.set(key, serialized, 'NX');
          return result === 'OK';
        }
        await this.redis.set(key, serialized);
      }

      return true;
    } catch (error) {
      this.logger.error(`Failed to set key ${key}:`, error);
      return false;
    }
  }

  async del(...keys: string[]): Promise<number> {
    try {
      return await this.redis.del(...keys);
    } catch (error) {
      this.logger.error(`Failed to delete keys ${keys.join(', ')}:`, error);
      return 0;
    }
  }

  async exists(...keys: string[]): Promise<number> {
    try {
      return await this.redis.exists(...keys);
    } catch (error) {
      this.logger.error(
        `Failed to check existence of keys ${keys.join(', ')}:`,
        error,
      );
      return 0;
    }
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const result = await this.redis.expire(key, seconds);
      return result === 1;
    } catch (error) {
      this.logger.error(`Failed to set expiry for key ${key}:`, error);
      return false;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      return await this.redis.ttl(key);
    } catch (error) {
      this.logger.error(`Failed to get TTL for key ${key}:`, error);
      return -2;
    }
  }

  // Hash operations
  async hget<T = any>(key: string, field: string): Promise<T | null> {
    try {
      const value = await this.redis.hget(key, field);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      this.logger.error(`Failed to hget ${key}.${field}:`, error);
      return null;
    }
  }

  async hset<T = any>(key: string, field: string, value: T): Promise<boolean> {
    try {
      const result = await this.redis.hset(key, field, JSON.stringify(value));
      return result >= 0;
    } catch (error) {
      this.logger.error(`Failed to hset ${key}.${field}:`, error);
      return false;
    }
  }

  async hgetall<T = any>(key: string): Promise<Record<string, T> | null> {
    try {
      const hash = await this.redis.hgetall(key);
      if (!hash || Object.keys(hash).length === 0) return null;

      const result: Record<string, T> = {};
      for (const [field, value] of Object.entries(hash)) {
        result[field] = JSON.parse(value);
      }
      return result;
    } catch (error) {
      this.logger.error(`Failed to hgetall ${key}:`, error);
      return null;
    }
  }

  async hdel(key: string, ...fields: string[]): Promise<number> {
    try {
      return await this.redis.hdel(key, ...fields);
    } catch (error) {
      this.logger.error(
        `Failed to hdel ${key} fields ${fields.join(', ')}:`,
        error,
      );
      return 0;
    }
  }

  // List operations
  async lpush<T = any>(key: string, ...values: T[]): Promise<number> {
    try {
      const serialized = values.map((v) => JSON.stringify(v));
      return await this.redis.lpush(key, ...serialized);
    } catch (error) {
      this.logger.error(`Failed to lpush to ${key}:`, error);
      return 0;
    }
  }

  async rpop<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.rpop(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      this.logger.error(`Failed to rpop from ${key}:`, error);
      return null;
    }
  }

  async lrange<T = any>(
    key: string,
    start: number,
    stop: number,
  ): Promise<T[]> {
    try {
      const values = await this.redis.lrange(key, start, stop);
      return values.map((v) => JSON.parse(v));
    } catch (error) {
      this.logger.error(`Failed to lrange ${key}:`, error);
      return [];
    }
  }

  // Set operations
  async sadd<T = any>(key: string, ...members: T[]): Promise<number> {
    try {
      const serialized = members.map((m) => JSON.stringify(m));
      return await this.redis.sadd(key, ...serialized);
    } catch (error) {
      this.logger.error(`Failed to sadd to ${key}:`, error);
      return 0;
    }
  }

  async smembers<T = any>(key: string): Promise<T[]> {
    try {
      const members = await this.redis.smembers(key);
      return members.map((m) => JSON.parse(m));
    } catch (error) {
      this.logger.error(`Failed to smembers ${key}:`, error);
      return [];
    }
  }

  async srem<T = any>(key: string, ...members: T[]): Promise<number> {
    try {
      const serialized = members.map((m) => JSON.stringify(m));
      return await this.redis.srem(key, ...serialized);
    } catch (error) {
      this.logger.error(`Failed to srem from ${key}:`, error);
      return 0;
    }
  }

  // Pattern operations
  async keys(pattern: string): Promise<string[]> {
    try {
      return await this.redis.keys(pattern);
    } catch (error) {
      this.logger.error(`Failed to get keys with pattern ${pattern}:`, error);
      return [];
    }
  }

  async deleteByPattern(pattern: string): Promise<number> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length === 0) return 0;
      return await this.redis.del(...keys);
    } catch (error) {
      this.logger.error(
        `Failed to delete keys with pattern ${pattern}:`,
        error,
      );
      return 0;
    }
  }

  // Lock mechanism for distributed systems
  async acquireLock(
    key: string,
    ttl: number = 30,
    identifier?: string,
  ): Promise<string | null> {
    try {
      const lockId = identifier || Math.random().toString(36).substring(2, 15);
      const result = await this.redis.set(
        `lock:${key}`,
        lockId,
        'EX',
        ttl,
        'NX',
      );
      return result === 'OK' ? lockId : null;
    } catch (error) {
      this.logger.error(`Failed to acquire lock ${key}:`, error);
      return null;
    }
  }

  async releaseLock(key: string, lockId: string): Promise<boolean> {
    try {
      const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;
      const result = await this.redis.eval(script, 1, `lock:${key}`, lockId);
      return result === 1;
    } catch (error) {
      this.logger.error(`Failed to release lock ${key}:`, error);
      return false;
    }
  }

  // Health check
  async ping(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      this.logger.error('Redis ping failed:', error);
      return false;
    }
  }

  // Increment operations
  async incr(key: string): Promise<number> {
    try {
      return await this.redis.incr(key);
    } catch (error) {
      this.logger.error(`Failed to increment key ${key}:`, error);
      return 0;
    }
  }

  async decr(key: string): Promise<number> {
    try {
      return await this.redis.decr(key);
    } catch (error) {
      this.logger.error(`Failed to decrement key ${key}:`, error);
      return 0;
    }
  }

  // Set with expiry (convenience method)
  async setWithExpiry(key: string, value: string, seconds: number): Promise<boolean> {
    try {
      await this.redis.setex(key, seconds, value);
      return true;
    } catch (error) {
      this.logger.error(`Failed to set ${key} with expiry:`, error);
      return false;
    }
  }

  // Get Redis client for advanced operations
  getClient(): Redis {
    return this.redis;
  }
}
