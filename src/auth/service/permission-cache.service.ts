import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

type ExtendedCache = Cache & {
  store: {
    keys: (pattern: string) => Promise<string[]>;
    mdel: (...keys: string[]) => Promise<void>;
  };
};

@Injectable()
export class PermissionCacheService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: ExtendedCache 
  ) {}

  private getPermissionKey(roleId: string): string {
    return `permissions:role:${roleId}`;
  }

  async getPermissions(roleId: string): Promise<string[] | null> {
    const permissions = await this.cacheManager.get<string[]>(this.getPermissionKey(roleId));
    return permissions ?? null;
  }

  async setPermissions(roleId: string, permissions: string[]): Promise<void> {
    await this.cacheManager.set(this.getPermissionKey(roleId), permissions, 300);
  }

  async invalidatePermissions(roleId: string): Promise<void> {
    await this.cacheManager.del(this.getPermissionKey(roleId));
  }

  async invalidateAllPermissions(): Promise<void> {
    const keys = await this.cacheManager.store.keys('permissions:role:*');
    if (keys.length > 0) {
      await this.cacheManager.store.mdel(...keys);
    }
  }
}
