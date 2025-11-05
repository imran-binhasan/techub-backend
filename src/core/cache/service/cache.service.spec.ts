import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from './cache.service';
import { RedisService } from '../../redis/service/redis.service';
import { CacheDomain } from '../enum/cache.enum';
import {
  CacheKeyTooLongException,
  CacheValueTooLargeException,
  InvalidCacheDomainException,
} from '../exceptions/cache.exception';

describe('CacheService', () => {
  let service: CacheService;
  let redisService: jest.Mocked<RedisService>;

  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    keys: jest.fn(),
    deleteByPattern: jest.fn(),
    sadd: jest.fn(),
    smembers: jest.fn(),
    ping: jest.fn(),
    getClient: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
    redisService = module.get(RedisService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('get', () => {
    it('should return cached value on cache hit', async () => {
      const testData = { id: 1, name: 'Test User' };
      redisService.get.mockResolvedValue(testData);

      const result = await service.get(CacheDomain.USERS, 'user:1');

      expect(result).toEqual(testData);
      expect(redisService.get).toHaveBeenCalledWith('user:user:1');
    });

    it('should return null on cache miss', async () => {
      redisService.get.mockResolvedValue(null);

      const result = await service.get(CacheDomain.USERS, 'user:999');

      expect(result).toBeNull();
      expect(redisService.get).toHaveBeenCalledWith('user:user:999');
    });

    it('should return null on error', async () => {
      redisService.get.mockRejectedValue(new Error('Redis error'));

      const result = await service.get(CacheDomain.USERS, 'user:1');

      expect(result).toBeNull();
    });

    it('should use custom prefix when provided', async () => {
      const testData = { id: 1 };
      redisService.get.mockResolvedValue(testData);

      await service.get(CacheDomain.USERS, 'custom:1', { prefix: 'custom' });

      expect(redisService.get).toHaveBeenCalledWith('custom:custom:1');
    });
  });

  describe('set', () => {
    it('should set cache with default TTL', async () => {
      const testData = { id: 1, name: 'Test User' };
      redisService.set.mockResolvedValue(true);

      const result = await service.set(CacheDomain.USERS, 'user:1', testData);

      expect(result).toBe(true);
      expect(redisService.set).toHaveBeenCalledWith(
        'user:user:1',
        testData,
        { ttl: 1800 }, // Default TTL for USERS domain
      );
    });

    it('should set cache with custom TTL', async () => {
      const testData = { id: 1 };
      redisService.set.mockResolvedValue(true);

      await service.set(CacheDomain.USERS, 'user:1', testData, { ttl: 3600 });

      expect(redisService.set).toHaveBeenCalledWith('user:user:1', testData, {
        ttl: 3600,
      });
    });

    it('should set cache tags when provided', async () => {
      const testData = { id: 1 };
      redisService.set.mockResolvedValue(true);
      redisService.sadd.mockResolvedValue(1);

      await service.set(CacheDomain.PRODUCTS, 'product:1', testData, {
        tags: ['products', 'vendor:123'],
      });

      expect(redisService.sadd).toHaveBeenCalledTimes(2);
      expect(redisService.sadd).toHaveBeenCalledWith(
        'tag:products',
        'prod:product:1',
      );
      expect(redisService.sadd).toHaveBeenCalledWith(
        'tag:vendor:123',
        'prod:product:1',
      );
    });

    it('should return false on error', async () => {
      redisService.set.mockRejectedValue(new Error('Redis error'));

      const result = await service.set(CacheDomain.USERS, 'user:1', {});

      expect(result).toBe(false);
    });
  });

  describe('del', () => {
    it('should delete single key', async () => {
      redisService.del.mockResolvedValue(1);

      const result = await service.del(CacheDomain.USERS, 'user:1');

      expect(result).toBe(1);
      expect(redisService.del).toHaveBeenCalledWith('user:user:1');
    });

    it('should delete multiple keys', async () => {
      redisService.del.mockResolvedValue(3);

      const result = await service.del(
        CacheDomain.USERS,
        'user:1',
        'user:2',
        'user:3',
      );

      expect(result).toBe(3);
      expect(redisService.del).toHaveBeenCalledWith(
        'user:user:1',
        'user:user:2',
        'user:user:3',
      );
    });

    it('should return 0 on error', async () => {
      redisService.del.mockRejectedValue(new Error('Redis error'));

      const result = await service.del(CacheDomain.USERS, 'user:1');

      expect(result).toBe(0);
    });
  });

  describe('exists', () => {
    it('should return true when key exists', async () => {
      redisService.exists.mockResolvedValue(1);

      const result = await service.exists(CacheDomain.USERS, 'user:1');

      expect(result).toBe(true);
      expect(redisService.exists).toHaveBeenCalledWith('user:user:1');
    });

    it('should return false when key does not exist', async () => {
      redisService.exists.mockResolvedValue(0);

      const result = await service.exists(CacheDomain.USERS, 'user:999');

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      redisService.exists.mockRejectedValue(new Error('Redis error'));

      const result = await service.exists(CacheDomain.USERS, 'user:1');

      expect(result).toBe(false);
    });
  });

  describe('expire', () => {
    it('should set expiration time', async () => {
      redisService.expire.mockResolvedValue(true);

      const result = await service.expire(CacheDomain.USERS, 'user:1', 3600);

      expect(result).toBe(true);
      expect(redisService.expire).toHaveBeenCalledWith('user:user:1', 3600);
    });

    it('should return false on error', async () => {
      redisService.expire.mockRejectedValue(new Error('Redis error'));

      const result = await service.expire(CacheDomain.USERS, 'user:1', 3600);

      expect(result).toBe(false);
    });
  });

  describe('warmCache', () => {
    it('should warm cache with multiple entries', async () => {
      redisService.set.mockResolvedValue(true);

      const data = {
        'user:1': { id: 1, name: 'User 1' },
        'user:2': { id: 2, name: 'User 2' },
        'user:3': { id: 3, name: 'User 3' },
      };

      const result = await service.warmCache(CacheDomain.USERS, data);

      expect(result).toHaveLength(3);
      expect(result.every((r) => r === true)).toBe(true);
      expect(redisService.set).toHaveBeenCalledTimes(3);
    });

    it('should warm cache with custom TTL', async () => {
      redisService.set.mockResolvedValue(true);

      await service.warmCache(
        CacheDomain.USERS,
        { 'user:1': { id: 1 } },
        { ttl: 7200 },
      );

      expect(redisService.set).toHaveBeenCalledWith(
        'user:user:1',
        { id: 1 },
        { ttl: 7200 },
      );
    });
  });

  describe('getByPattern', () => {
    it('should get all keys matching pattern', async () => {
      redisService.keys.mockResolvedValue([
        'user:user:1',
        'user:user:2',
        'user:user:3',
      ]);
      redisService.get
        .mockResolvedValueOnce({ id: 1 })
        .mockResolvedValueOnce({ id: 2 })
        .mockResolvedValueOnce({ id: 3 });

      const result = await service.getByPattern(CacheDomain.USERS, 'user:*');

      expect(result).toEqual({
        'user:1': { id: 1 },
        'user:2': { id: 2 },
        'user:3': { id: 3 },
      });
      expect(redisService.keys).toHaveBeenCalledWith('user:user:*');
    });

    it('should return empty object when no keys match', async () => {
      redisService.keys.mockResolvedValue([]);

      const result = await service.getByPattern(CacheDomain.USERS, 'user:*');

      expect(result).toEqual({});
    });

    it('should return empty object on error', async () => {
      redisService.keys.mockRejectedValue(new Error('Redis error'));

      const result = await service.getByPattern(CacheDomain.USERS, 'user:*');

      expect(result).toEqual({});
    });
  });

  describe('deleteByPattern', () => {
    it('should delete all keys matching pattern', async () => {
      redisService.deleteByPattern.mockResolvedValue(5);

      const result = await service.deleteByPattern(CacheDomain.USERS, 'user:*');

      expect(result).toBe(5);
      expect(redisService.deleteByPattern).toHaveBeenCalledWith('user:user:*');
    });

    it('should return 0 on error', async () => {
      redisService.deleteByPattern.mockRejectedValue(new Error('Redis error'));

      const result = await service.deleteByPattern(CacheDomain.USERS, 'user:*');

      expect(result).toBe(0);
    });
  });

  describe('invalidateByTag', () => {
    it('should invalidate all cache entries with tag', async () => {
      redisService.smembers.mockResolvedValue([
        'prod:product:1',
        'prod:product:2',
        'prod:product:3',
      ]);
      redisService.del.mockResolvedValue(3);

      const result = await service.invalidateByTag('products');

      expect(result).toBe(3);
      expect(redisService.smembers).toHaveBeenCalledWith('tag:products');
      expect(redisService.del).toHaveBeenCalledWith(
        'prod:product:1',
        'prod:product:2',
        'prod:product:3',
      );
      expect(redisService.del).toHaveBeenCalledWith('tag:products');
    });

    it('should return 0 when no keys have tag', async () => {
      redisService.smembers.mockResolvedValue([]);

      const result = await service.invalidateByTag('products');

      expect(result).toBe(0);
    });

    it('should return 0 on error', async () => {
      redisService.smembers.mockRejectedValue(new Error('Redis error'));

      const result = await service.invalidateByTag('products');

      expect(result).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return stats for specific domain', async () => {
      // Simulate some cache hits and misses
      redisService.get.mockResolvedValueOnce({ id: 1 });
      await service.get(CacheDomain.USERS, 'user:1');

      redisService.get.mockResolvedValueOnce(null);
      await service.get(CacheDomain.USERS, 'user:2');

      redisService.get.mockResolvedValueOnce({ id: 3 });
      await service.get(CacheDomain.USERS, 'user:3');

      const stats = await service.getStats(CacheDomain.USERS);

      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('hitRate');
    });

    it('should return stats for all domains', async () => {
      const stats = await service.getStats();

      expect(typeof stats).toBe('object');
    });
  });

  describe('clearStats', () => {
    it('should clear all statistics', async () => {
      await service.clearStats();

      const stats = await service.getStats();
      expect(Object.keys(stats)).toHaveLength(0);
    });
  });

  describe('healthCheck', () => {
    it('should return true when Redis is healthy', async () => {
      redisService.ping.mockResolvedValue(true);

      const result = await service.healthCheck();

      expect(result).toBe(true);
      expect(redisService.ping).toHaveBeenCalled();
    });

    it('should return false when Redis is unhealthy', async () => {
      redisService.ping.mockResolvedValue(false);

      const result = await service.healthCheck();

      expect(result).toBe(false);
    });
  });

  describe('mget', () => {
    it('should get multiple keys in bulk', async () => {
      const mockPipeline = {
        get: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          [null, JSON.stringify({ id: 1 })],
          [null, JSON.stringify({ id: 2 })],
          [null, JSON.stringify({ id: 3 })],
        ]),
      };

      redisService.getClient.mockReturnValue({
        pipeline: () => mockPipeline,
      } as any);

      const result = await service.mget(CacheDomain.USERS, [
        'user:1',
        'user:2',
        'user:3',
      ]);

      expect(result).toEqual({
        'user:1': { id: 1 },
        'user:2': { id: 2 },
        'user:3': { id: 3 },
      });
    });

    it('should handle null values in bulk get', async () => {
      const mockPipeline = {
        get: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          [null, JSON.stringify({ id: 1 })],
          [null, null],
        ]),
      };

      redisService.getClient.mockReturnValue({
        pipeline: () => mockPipeline,
      } as any);

      const result = await service.mget(CacheDomain.USERS, [
        'user:1',
        'user:2',
      ]);

      expect(result).toEqual({
        'user:1': { id: 1 },
        'user:2': null,
      });
    });
  });

  describe('mset', () => {
    it('should set multiple keys in bulk', async () => {
      const mockPipeline = {
        setex: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          [null, 'OK'],
          [null, 'OK'],
          [null, 'OK'],
        ]),
      };

      redisService.getClient.mockReturnValue({
        pipeline: () => mockPipeline,
      } as any);

      const data = {
        'user:1': { id: 1 },
        'user:2': { id: 2 },
        'user:3': { id: 3 },
      };

      const result = await service.mset(CacheDomain.USERS, data);

      expect(result).toBe(true);
      expect(mockPipeline.setex).toHaveBeenCalledTimes(3);
    });

    it('should return false on bulk set error', async () => {
      const mockPipeline = {
        setex: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(new Error('Redis error')),
      };

      redisService.getClient.mockReturnValue({
        pipeline: () => mockPipeline,
      } as any);

      const result = await service.mset(CacheDomain.USERS, { 'user:1': {} });

      expect(result).toBe(false);
    });
  });
});
