import { Injectable, Logger } from '@nestjs/common';
import { CacheService } from 'src/cache/service/cache.service';
import { RabbitMQService } from 'src/rabbitmq/service/rabbitmq.service';

@Injectable()
export class PermissionCacheService {
  private readonly logger = new Logger(PermissionCacheService.name);

  constructor(
    private readonly cacheService: CacheService,
    private readonly rabbitMQService: RabbitMQService,
  ) {}

  // Role permissions
  async getPermissions(roleId: string): Promise<string[] | null> {
    return this.cacheService.get<string[]>('permissions', `role:${roleId}`);
  }

  async setPermissions(roleId: string, permissions: string[]): Promise<void> {
    const success = await this.cacheService.set(
      'permissions',
      `role:${roleId}`,
      permissions,
      { ttl: 3600, tags: [`role:${roleId}`, 'permissions'] },
    );

    if (success) {
      // Notify other services about permission update
      await this.rabbitMQService.publishEvent('permissions.updated', {
        roleId,
        permissions,
        timestamp: new Date().toISOString(),
      });
    }
  }

  async invalidatePermissions(roleId: string): Promise<void> {
    await this.cacheService.del('permissions', `role:${roleId}`);

    // Notify about invalidation
    await this.rabbitMQService.publishEvent('permissions.invalidated', {
      roleId,
      timestamp: new Date().toISOString(),
    });
  }

  async invalidateAllPermissions(): Promise<void> {
    await this.cacheService.deleteByPattern('permissions', 'role:*');
    await this.rabbitMQService.publishEvent('permissions.bulk.invalidated', {
      timestamp: new Date().toISOString(),
    });
  }

  // User sessions for permission caching
  async getUserSession(userId: string): Promise<any> {
    return this.cacheService.get('sessions', `user:${userId}`);
  }

  async setUserSession(
    userId: string,
    sessionData: any,
    ttlSeconds?: number,
  ): Promise<void> {
    await this.cacheService.set('sessions', `user:${userId}`, sessionData, {
      ttl: ttlSeconds || 86400,
      tags: [`user:${userId}`, 'sessions'],
    });
  }

  async invalidateUserSession(userId: string): Promise<void> {
    await this.cacheService.del('sessions', `user:${userId}`);
  }

  // Batch operations
  async getUserPermissions(
    userIds: string[],
  ): Promise<Record<string, string[]>> {
    const keys = userIds.map((id) => `user:${id}`);
    const result = await this.cacheService.mget<string[]>('permissions', keys);
    // Remove or replace nulls with empty arrays to satisfy the return type
    const filtered: Record<string, string[]> = {};
    Object.entries(result).forEach(([key, value]) => {
      if (value !== null) {
        filtered[key] = value;
      } else {
        filtered[key] = [];
      }
    });
    return filtered;
  }

  async setUserPermissions(data: Record<string, string[]>): Promise<void> {
    await this.cacheService.mset('permissions', data);
  }

  // Permission hierarchy caching
  async getEffectivePermissions(
    roleId: string,
    includeInherited = true,
  ): Promise<string[] | null> {
    const cacheKey = includeInherited
      ? `effective:${roleId}`
      : `direct:${roleId}`;
    return this.cacheService.get<string[]>('permissions', cacheKey);
  }

  async setEffectivePermissions(
    roleId: string,
    permissions: string[],
    includeInherited = true,
  ): Promise<void> {
    const cacheKey = includeInherited
      ? `effective:${roleId}`
      : `direct:${roleId}`;
    await this.cacheService.set('permissions', cacheKey, permissions, {
      ttl: 3600,
      tags: [`role:${roleId}`, 'permissions', 'effective'],
    });
  }

  // Cache warming for critical roles
  async warmCriticalPermissions(criticalRoles: string[]): Promise<void> {
    this.logger.log(`Warming cache for ${criticalRoles.length} critical roles`);

    // This would typically fetch from database and warm the cache
    // Implementation depends on your permission service
    for (const roleId of criticalRoles) {
      try {
        // Fetch from database (implement based on your PermissionService)
        // const permissions = await this.permissionService.getUserPermissions(roleId);
        // await this.setPermissions(roleId, permissions);

        this.logger.debug(`Warmed permissions for role: ${roleId}`);
      } catch (error) {
        this.logger.error(
          `Failed to warm permissions for role ${roleId}:`,
          error,
        );
      }
    }
  }

  // Statistics
  async getPermissionCacheStats() {
    return this.cacheService.getStats('permissions');
  }
}
