import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from 'src/core/redis/service/redis.service';

export interface CacheConfig {
  ttl: number;
  prefix?: string;
  tags?: string[];
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly stats = new Map<string, { hits: number; misses: number }>();

  // Default cache configurations for different domains
  private readonly defaultConfigs = {
    permissions: { ttl: 900, prefix: 'perm' }, // 15 minutes
    users: { ttl: 1800, prefix: 'user' }, // 30 minutes
    products: { ttl: 3600, prefix: 'prod' }, // 1 hour
    categories: { ttl: 7200, prefix: 'cat' }, // 2 hours
    sessions: { ttl: 86400, prefix: 'sess' }, // 24 hours
    cart: { ttl: 604800, prefix: 'cart' }, // 7 days
    inventory: { ttl: 300, prefix: 'inv' }, // 5 minutes
    pricing: { ttl: 1800, prefix: 'price' }, // 30 minutes
    orders: { ttl: 3600, prefix: 'order' }, // 1 hour
    settings: { ttl: 14400, prefix: 'set' }, // 4 hours
  };

  constructor(private readonly redisService: RedisService) {}

  private buildKey(domain: string, key: string, config?: CacheConfig): string {
    const prefix =
      config?.prefix || this.defaultConfigs[domain]?.prefix || domain;
    return `${prefix}:${key}`;
  }

  private updateStats(cacheKey: string, hit: boolean): void {
    const stats = this.stats.get(cacheKey) || { hits: 0, misses: 0 };
    if (hit) {
      stats.hits++;
    } else {
      stats.misses++;
    }
    this.stats.set(cacheKey, stats);
  }

  // Generic cache operations
  async get<T>(
    domain: string,
    key: string,
    config?: CacheConfig,
  ): Promise<T | null> {
    try {
      const cacheKey = this.buildKey(domain, key, config);
      const value = await this.redisService.get<T>(cacheKey);

      this.updateStats(domain, value !== null);

      if (value) {
        this.logger.debug(`Cache HIT: ${cacheKey}`);
      } else {
        this.logger.debug(`Cache MISS: ${cacheKey}`);
      }

      return value;
    } catch (error) {
      this.logger.error(`Cache get failed for ${domain}:${key}`, error);
      return null;
    }
  }

  async set<T>(
    domain: string,
    key: string,
    value: T,
    config?: CacheConfig,
  ): Promise<boolean> {
    try {
      const cacheKey = this.buildKey(domain, key, config);
      const ttl = config?.ttl || this.defaultConfigs[domain]?.ttl || 3600;

      const success = await this.redisService.set(cacheKey, value, { ttl });

      if (success) {
        this.logger.debug(`Cache SET: ${cacheKey} (TTL: ${ttl}s)`);

        // Set cache tags for invalidation
        if (config?.tags?.length) {
          await this.tagCache(cacheKey, config.tags);
        }
      }

      return success;
    } catch (error) {
      this.logger.error(`Cache set failed for ${domain}:${key}`, error);
      return false;
    }
  }

  async del(domain: string, ...keys: string[]): Promise<number> {
    try {
      const cacheKeys = keys.map((key) => this.buildKey(domain, key));
      return await this.redisService.del(...cacheKeys);
    } catch (error) {
      this.logger.error(
        `Cache delete failed for ${domain}:${keys.join(',')}`,
        error,
      );
      return 0;
    }
  }

  async exists(domain: string, key: string): Promise<boolean> {
    try {
      const cacheKey = this.buildKey(domain, key);
      const count = await this.redisService.exists(cacheKey);
      return count > 0;
    } catch (error) {
      this.logger.error(
        `Cache exists check failed for ${domain}:${key}`,
        error,
      );
      return false;
    }
  }

  async expire(domain: string, key: string, ttl: number): Promise<boolean> {
    try {
      const cacheKey = this.buildKey(domain, key);
      return await this.redisService.expire(cacheKey, ttl);
    } catch (error) {
      this.logger.error(`Cache expire failed for ${domain}:${key}`, error);
      return false;
    }
  }

  // Cache warming
  async warmCache<T>(
    domain: string,
    data: Record<string, T>,
    config?: CacheConfig,
  ): Promise<boolean[]> {
    const promises = Object.entries(data).map(([key, value]) =>
      this.set(domain, key, value, config),
    );

    return Promise.all(promises);
  }

  // Pattern-based operations
  async getByPattern<T>(
    domain: string,
    pattern: string,
  ): Promise<Record<string, T>> {
    try {
      const prefix = this.defaultConfigs[domain]?.prefix || domain;
      const searchPattern = `${prefix}:${pattern}`;
      const keys = await this.redisService.keys(searchPattern);

      const results: Record<string, T> = {};

      for (const key of keys) {
        const value = await this.redisService.get<T>(key);
        if (value !== null) {
          // Extract original key by removing prefix
          const originalKey = key.replace(`${prefix}:`, '');
          results[originalKey] = value;
        }
      }

      return results;
    } catch (error) {
      this.logger.error(`Pattern get failed for ${domain}:${pattern}`, error);
      return {};
    }
  }

  async deleteByPattern(domain: string, pattern: string): Promise<number> {
    try {
      const prefix = this.defaultConfigs[domain]?.prefix || domain;
      const searchPattern = `${prefix}:${pattern}`;
      return await this.redisService.deleteByPattern(searchPattern);
    } catch (error) {
      this.logger.error(
        `Pattern delete failed for ${domain}:${pattern}`,
        error,
      );
      return 0;
    }
  }

  // Cache tagging for group invalidation
  private async tagCache(cacheKey: string, tags: string[]): Promise<void> {
    const promises = tags.map((tag) =>
      this.redisService.sadd(`tag:${tag}`, cacheKey),
    );
    await Promise.all(promises);
  }

  async invalidateByTag(tag: string): Promise<number> {
    try {
      const keys = await this.redisService.smembers<string>(`tag:${tag}`);
      if (keys.length === 0) return 0;

      // Delete all cached items with this tag
      const deleted = await this.redisService.del(...keys);

      // Clean up the tag set
      await this.redisService.del(`tag:${tag}`);

      this.logger.log(`Invalidated ${deleted} cache entries for tag: ${tag}`);
      return deleted;
    } catch (error) {
      this.logger.error(`Tag invalidation failed for tag: ${tag}`, error);
      return 0;
    }
  }

  // Cache statistics
  async getStats(
    domain?: string,
  ): Promise<CacheStats | Record<string, CacheStats>> {
    if (domain) {
      const stats = this.stats.get(domain) || { hits: 0, misses: 0 };
      return {
        ...stats,
        hitRate:
          stats.hits + stats.misses > 0
            ? (stats.hits / (stats.hits + stats.misses)) * 100
            : 0,
      };
    }

    const allStats: Record<string, CacheStats> = {};
    for (const [key, stats] of this.stats.entries()) {
      allStats[key] = {
        ...stats,
        hitRate:
          stats.hits + stats.misses > 0
            ? (stats.hits / (stats.hits + stats.misses)) * 100
            : 0,
      };
    }

    return allStats;
  }

  async clearStats(): Promise<void> {
    this.stats.clear();
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    return await this.redisService.ping();
  }

  // Memory operations for high-performance scenarios
  async mget<T>(
    domain: string,
    keys: string[],
  ): Promise<Record<string, T | null>> {
    const cacheKeys = keys.map((key) => this.buildKey(domain, key));
    const results: Record<string, T | null> = {};

    try {
      const pipeline = this.redisService.getClient().pipeline();
      cacheKeys.forEach((key) => pipeline.get(key));

      const responses = await pipeline.exec();

      keys.forEach((originalKey, index) => {
        const response = responses?.[index];
        if (response && response[1]) {
          try {
            results[originalKey] = JSON.parse(response[1] as string);
          } catch {
            results[originalKey] = response[1] as T;
          }
        } else {
          results[originalKey] = null;
        }
      });

      return results;
    } catch (error) {
      this.logger.error(`Bulk get failed for ${domain}`, error);
      return keys.reduce((acc, key) => ({ ...acc, [key]: null }), {});
    }
  }

  async mset<T>(
    domain: string,
    data: Record<string, T>,
    config?: CacheConfig,
  ): Promise<boolean> {
    try {
      const ttl = config?.ttl || this.defaultConfigs[domain]?.ttl || 3600;
      const pipeline = this.redisService.getClient().pipeline();

      Object.entries(data).forEach(([key, value]) => {
        const cacheKey = this.buildKey(domain, key, config);
        const serialized = JSON.stringify(value);
        pipeline.setex(cacheKey, ttl, serialized);
      });

      const results = await pipeline.exec();
      return results?.every((result) => result[1] === 'OK') || false;
    } catch (error) {
      this.logger.error(`Bulk set failed for ${domain}`, error);
      return false;
    }
  }
}
