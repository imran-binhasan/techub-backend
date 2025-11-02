import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';
import Redis from 'ioredis';
import {
  RedisConnectionException,
  RedisOperationException,
  RedisLockException,
} from '../exceptions/redis.exception';

describe('RedisService', () => {
  let service: RedisService;
  let mockRedis: jest.Mocked<Redis>;

  beforeEach(async () => {
    mockRedis = {
      get: jest.fn(),
      set: jest.fn(),
      setex: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
      expire: jest.fn(),
      ttl: jest.fn(),
      hget: jest.fn(),
      hset: jest.fn(),
      hgetall: jest.fn(),
      hdel: jest.fn(),
      lpush: jest.fn(),
      rpop: jest.fn(),
      lrange: jest.fn(),
      sadd: jest.fn(),
      smembers: jest.fn(),
      srem: jest.fn(),
      keys: jest.fn(),
      ping: jest.fn(),
      eval: jest.fn(),
      incr: jest.fn(),
      decr: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: 'REDIS_CLIENT',
          useValue: mockRedis,
        },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('get', () => {
    it('should get value from Redis', async () => {
      const testData = { id: 1, name: 'Test' };
      mockRedis.get.mockResolvedValue(JSON.stringify(testData));

      const result = await service.get('test:key');

      expect(result).toEqual(testData);
      expect(mockRedis.get).toHaveBeenCalledWith('test:key');
    });

    it('should return null when key does not exist', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await service.get('nonexistent');

      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis error'));

      const result = await service.get('test:key');

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should set value without TTL', async () => {
      mockRedis.set.mockResolvedValue('OK');

      const result = await service.set('test:key', { id: 1 });

      expect(result).toBe(true);
      expect(mockRedis.set).toHaveBeenCalledWith(
        'test:key',
        JSON.stringify({ id: 1 }),
      );
    });

    it('should set value with TTL', async () => {
      mockRedis.setex.mockResolvedValue('OK');

      const result = await service.set('test:key', { id: 1 }, { ttl: 3600 });

      expect(result).toBe(true);
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'test:key',
        3600,
        JSON.stringify({ id: 1 }),
      );
    });

    it('should set value with NX option', async () => {
      mockRedis.set.mockResolvedValue('OK');

      const result = await service.set('test:key', { id: 1 }, { nx: true });

      expect(result).toBe(true);
      expect(mockRedis.set).toHaveBeenCalledWith(
        'test:key',
        JSON.stringify({ id: 1 }),
        'NX',
      );
    });

    it('should return false when NX fails', async () => {
      mockRedis.set.mockResolvedValue(null);

      const result = await service.set('test:key', { id: 1 }, { nx: true });

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      mockRedis.set.mockRejectedValue(new Error('Redis error'));

      const result = await service.set('test:key', { id: 1 });

      expect(result).toBe(false);
    });
  });

  describe('del', () => {
    it('should delete single key', async () => {
      mockRedis.del.mockResolvedValue(1);

      const result = await service.del('test:key');

      expect(result).toBe(1);
      expect(mockRedis.del).toHaveBeenCalledWith('test:key');
    });

    it('should delete multiple keys', async () => {
      mockRedis.del.mockResolvedValue(3);

      const result = await service.del('key1', 'key2', 'key3');

      expect(result).toBe(3);
      expect(mockRedis.del).toHaveBeenCalledWith('key1', 'key2', 'key3');
    });

    it('should return 0 on error', async () => {
      mockRedis.del.mockRejectedValue(new Error('Redis error'));

      const result = await service.del('test:key');

      expect(result).toBe(0);
    });
  });

  describe('exists', () => {
    it('should return count of existing keys', async () => {
      mockRedis.exists.mockResolvedValue(2);

      const result = await service.exists('key1', 'key2');

      expect(result).toBe(2);
      expect(mockRedis.exists).toHaveBeenCalledWith('key1', 'key2');
    });

    it('should return 0 on error', async () => {
      mockRedis.exists.mockRejectedValue(new Error('Redis error'));

      const result = await service.exists('test:key');

      expect(result).toBe(0);
    });
  });

  describe('expire', () => {
    it('should set expiration time', async () => {
      mockRedis.expire.mockResolvedValue(1);

      const result = await service.expire('test:key', 3600);

      expect(result).toBe(true);
      expect(mockRedis.expire).toHaveBeenCalledWith('test:key', 3600);
    });

    it('should return false when key does not exist', async () => {
      mockRedis.expire.mockResolvedValue(0);

      const result = await service.expire('nonexistent', 3600);

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      mockRedis.expire.mockRejectedValue(new Error('Redis error'));

      const result = await service.expire('test:key', 3600);

      expect(result).toBe(false);
    });
  });

  describe('ttl', () => {
    it('should return TTL for key', async () => {
      mockRedis.ttl.mockResolvedValue(3600);

      const result = await service.ttl('test:key');

      expect(result).toBe(3600);
      expect(mockRedis.ttl).toHaveBeenCalledWith('test:key');
    });

    it('should return -2 on error', async () => {
      mockRedis.ttl.mockRejectedValue(new Error('Redis error'));

      const result = await service.ttl('test:key');

      expect(result).toBe(-2);
    });
  });

  describe('Hash operations', () => {
    describe('hget', () => {
      it('should get hash field value', async () => {
        const testData = { id: 1 };
        mockRedis.hget.mockResolvedValue(JSON.stringify(testData));

        const result = await service.hget('test:hash', 'field');

        expect(result).toEqual(testData);
        expect(mockRedis.hget).toHaveBeenCalledWith('test:hash', 'field');
      });

      it('should return null when field does not exist', async () => {
        mockRedis.hget.mockResolvedValue(null);

        const result = await service.hget('test:hash', 'field');

        expect(result).toBeNull();
      });
    });

    describe('hset', () => {
      it('should set hash field value', async () => {
        mockRedis.hset.mockResolvedValue(1);

        const result = await service.hset('test:hash', 'field', { id: 1 });

        expect(result).toBe(true);
        expect(mockRedis.hset).toHaveBeenCalledWith(
          'test:hash',
          'field',
          JSON.stringify({ id: 1 }),
        );
      });

      it('should return false on error', async () => {
        mockRedis.hset.mockRejectedValue(new Error('Redis error'));

        const result = await service.hset('test:hash', 'field', {});

        expect(result).toBe(false);
      });
    });

    describe('hgetall', () => {
      it('should get all hash fields', async () => {
        mockRedis.hgetall.mockResolvedValue({
          field1: JSON.stringify({ id: 1 }),
          field2: JSON.stringify({ id: 2 }),
        });

        const result = await service.hgetall('test:hash');

        expect(result).toEqual({
          field1: { id: 1 },
          field2: { id: 2 },
        });
      });

      it('should return null when hash is empty', async () => {
        mockRedis.hgetall.mockResolvedValue({});

        const result = await service.hgetall('test:hash');

        expect(result).toBeNull();
      });
    });

    describe('hdel', () => {
      it('should delete hash fields', async () => {
        mockRedis.hdel.mockResolvedValue(2);

        const result = await service.hdel('test:hash', 'field1', 'field2');

        expect(result).toBe(2);
        expect(mockRedis.hdel).toHaveBeenCalledWith(
          'test:hash',
          'field1',
          'field2',
        );
      });
    });
  });

  describe('List operations', () => {
    describe('lpush', () => {
      it('should push values to list', async () => {
        mockRedis.lpush.mockResolvedValue(3);

        const result = await service.lpush('test:list', { id: 1 }, { id: 2 });

        expect(result).toBe(3);
        expect(mockRedis.lpush).toHaveBeenCalledWith(
          'test:list',
          JSON.stringify({ id: 1 }),
          JSON.stringify({ id: 2 }),
        );
      });
    });

    describe('rpop', () => {
      it('should pop value from list', async () => {
        (mockRedis.rpop as any).mockResolvedValue(JSON.stringify({ id: 1 }));

        const result = await service.rpop('test:list');

        expect(result).toEqual({ id: 1 });
      });

      it('should return null when list is empty', async () => {
        (mockRedis.rpop as any).mockResolvedValue(null);

        const result = await service.rpop('test:list');

        expect(result).toBeNull();
      });
    });

    describe('lrange', () => {
      it('should get range of values from list', async () => {
        mockRedis.lrange.mockResolvedValue([
          JSON.stringify({ id: 1 }),
          JSON.stringify({ id: 2 }),
        ]);

        const result = await service.lrange('test:list', 0, 1);

        expect(result).toEqual([{ id: 1 }, { id: 2 }]);
      });
    });
  });

  describe('Set operations', () => {
    describe('sadd', () => {
      it('should add members to set', async () => {
        mockRedis.sadd.mockResolvedValue(2);

        const result = await service.sadd('test:set', { id: 1 }, { id: 2 });

        expect(result).toBe(2);
      });
    });

    describe('smembers', () => {
      it('should get all set members', async () => {
        mockRedis.smembers.mockResolvedValue([
          JSON.stringify({ id: 1 }),
          JSON.stringify({ id: 2 }),
        ]);

        const result = await service.smembers('test:set');

        expect(result).toEqual([{ id: 1 }, { id: 2 }]);
      });
    });

    describe('srem', () => {
      it('should remove members from set', async () => {
        mockRedis.srem.mockResolvedValue(2);

        const result = await service.srem('test:set', { id: 1 }, { id: 2 });

        expect(result).toBe(2);
      });
    });
  });

  describe('Pattern operations', () => {
    describe('keys', () => {
      it('should return keys matching pattern', async () => {
        mockRedis.keys.mockResolvedValue(['key1', 'key2', 'key3']);

        const result = await service.keys('test:*');

        expect(result).toEqual(['key1', 'key2', 'key3']);
        expect(mockRedis.keys).toHaveBeenCalledWith('test:*');
      });
    });

    describe('deleteByPattern', () => {
      it('should delete all keys matching pattern', async () => {
        mockRedis.keys.mockResolvedValue(['key1', 'key2', 'key3']);
        mockRedis.del.mockResolvedValue(3);

        const result = await service.deleteByPattern('test:*');

        expect(result).toBe(3);
        expect(mockRedis.keys).toHaveBeenCalledWith('test:*');
        expect(mockRedis.del).toHaveBeenCalledWith('key1', 'key2', 'key3');
      });

      it('should return 0 when no keys match', async () => {
        mockRedis.keys.mockResolvedValue([]);

        const result = await service.deleteByPattern('test:*');

        expect(result).toBe(0);
      });
    });
  });

  describe('Lock mechanism', () => {
    describe('acquireLock', () => {
      it('should acquire lock successfully', async () => {
        mockRedis.set.mockResolvedValue('OK');

        const lockId = await service.acquireLock('test:resource', 30);

        expect(lockId).toBeTruthy();
        expect(typeof lockId).toBe('string');
        expect(mockRedis.set).toHaveBeenCalledWith(
          'lock:test:resource',
          lockId,
          'EX',
          30,
          'NX',
        );
      });

      it('should fail to acquire lock when already locked', async () => {
        mockRedis.set.mockResolvedValue(null);

        const lockId = await service.acquireLock('test:resource', 30);

        expect(lockId).toBeNull();
      });

      it('should use custom identifier', async () => {
        mockRedis.set.mockResolvedValue('OK');

        const lockId = await service.acquireLock(
          'test:resource',
          30,
          'custom-id',
        );

        expect(lockId).toBe('custom-id');
        expect(mockRedis.set).toHaveBeenCalledWith(
          'lock:test:resource',
          'custom-id',
          'EX',
          30,
          'NX',
        );
      });
    });

    describe('releaseLock', () => {
      it('should release lock successfully', async () => {
        mockRedis.eval.mockResolvedValue(1);

        const result = await service.releaseLock('test:resource', 'lock-id');

        expect(result).toBe(true);
        expect(mockRedis.eval).toHaveBeenCalled();
      });

      it('should fail to release lock with wrong identifier', async () => {
        mockRedis.eval.mockResolvedValue(0);

        const result = await service.releaseLock(
          'test:resource',
          'wrong-lock-id',
        );

        expect(result).toBe(false);
      });

      it('should return false on error', async () => {
        mockRedis.eval.mockRejectedValue(new Error('Redis error'));

        const result = await service.releaseLock('test:resource', 'lock-id');

        expect(result).toBe(false);
      });
    });
  });

  describe('Increment operations', () => {
    describe('incr', () => {
      it('should increment key value', async () => {
        mockRedis.incr.mockResolvedValue(5);

        const result = await service.incr('counter');

        expect(result).toBe(5);
        expect(mockRedis.incr).toHaveBeenCalledWith('counter');
      });

      it('should return 0 on error', async () => {
        mockRedis.incr.mockRejectedValue(new Error('Redis error'));

        const result = await service.incr('counter');

        expect(result).toBe(0);
      });
    });

    describe('decr', () => {
      it('should decrement key value', async () => {
        mockRedis.decr.mockResolvedValue(3);

        const result = await service.decr('counter');

        expect(result).toBe(3);
        expect(mockRedis.decr).toHaveBeenCalledWith('counter');
      });
    });

    describe('setWithExpiry', () => {
      it('should set value with expiry', async () => {
        mockRedis.setex.mockResolvedValue('OK');

        const result = await service.setWithExpiry('test:key', 'value', 3600);

        expect(result).toBe(true);
        expect(mockRedis.setex).toHaveBeenCalledWith('test:key', 3600, 'value');
      });

      it('should return false on error', async () => {
        mockRedis.setex.mockRejectedValue(new Error('Redis error'));

        const result = await service.setWithExpiry('test:key', 'value', 3600);

        expect(result).toBe(false);
      });
    });
  });

  describe('Health check', () => {
    it('should return true when Redis is healthy', async () => {
      mockRedis.ping.mockResolvedValue('PONG');

      const result = await service.ping();

      expect(result).toBe(true);
      expect(mockRedis.ping).toHaveBeenCalled();
    });

    it('should return false when Redis is unhealthy', async () => {
      mockRedis.ping.mockRejectedValue(new Error('Connection error'));

      const result = await service.ping();

      expect(result).toBe(false);
    });
  });

  describe('getClient', () => {
    it('should return Redis client', () => {
      const client = service.getClient();

      expect(client).toBe(mockRedis);
    });
  });
});
