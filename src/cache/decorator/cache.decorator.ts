import { SetMetadata } from '@nestjs/common';

export interface CacheableOptions {
  domain: string;
  keyGenerator?: string; // method name that generates cache key
  ttl?: number;
  tags?: string[];
  condition?: string; // method name that returns boolean for conditional caching
}

export const CACHEABLE_KEY = 'cacheable';

export const Cacheable = (options: CacheableOptions) =>
  SetMetadata(CACHEABLE_KEY, options);
