import Redis from 'ioredis';
import { monitoringService } from './monitoring.service';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
}

export class CacheService {
  private redis: Redis | null = null;
  private isConnected: boolean = false;
  private fallbackCache: Map<string, { value: any; expires: number }> = new Map();

  constructor() {
    this.initializeRedis();
  }

  private async initializeRedis(): Promise<void> {
    try {
      this.redis = new Redis({
        host: process.env['REDIS_HOST'] || 'localhost',
        port: parseInt(process.env['REDIS_PORT'] || '6379'),
        password: process.env['REDIS_PASSWORD'] || '',
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keepAlive: 30000,
        connectionName: 'reved-kids-cache'
      });

      // Test connection
      await this.redis.ping();
      this.isConnected = true;
    } catch (error) {
      console.warn('⚠️ Redis not available, using fallback cache:', (error as Error).message);
      this.isConnected = false;
    }
  }

  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    const fullKey = this.buildKey(key, options.prefix);

    try {
      if (this.isConnected && this.redis) {
        const result = await this.redis.get(fullKey);
        if (!result) {
          monitoringService.recordCacheMiss();
          return null;
        }
        
        monitoringService.recordCacheHit();
        
        try {
          return JSON.parse(result);
        } catch (parseError) {
          console.error('Cache JSON parse error:', parseError);
          // Remove corrupted data from Redis
          await this.redis.del(fullKey).catch(() => {});
          monitoringService.recordCacheMiss();
          return null;
        }
      } else {
        // Fallback to memory cache
        const result = this.getFromFallback<T>(fullKey);
        if (result === null) {
          monitoringService.recordCacheMiss();
        } else {
          monitoringService.recordCacheHit();
        }
        return result;
      }
    } catch (error) {
      console.error('Cache get error:', error);
      monitoringService.recordCacheMiss();
      return this.getFromFallback<T>(fullKey);
    }
  }

  async set(key: string, value: any, options: CacheOptions = {}): Promise<boolean> {
    const fullKey = this.buildKey(key, options.prefix);
    const ttl = options.ttl || 3600; // Default 1 hour

    try {
      if (this.isConnected && this.redis) {
        await this.redis.setex(fullKey, ttl, JSON.stringify(value));
        return true;
      } else {
        // Fallback to memory cache
        this.setInFallback(fullKey, value, ttl);
        return true;
      }
    } catch (error) {
      console.error('Cache set error:', error);
      this.setInFallback(fullKey, value, ttl);
      return false;
    }
  }

  async del(key: string, options: CacheOptions = {}): Promise<boolean> {
    const fullKey = this.buildKey(key, options.prefix);

    try {
      if (this.isConnected && this.redis) {
        await this.redis.del(fullKey);
      }
      this.fallbackCache.delete(fullKey);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      this.fallbackCache.delete(fullKey);
      return false;
    }
  }

  async invalidatePattern(pattern: string, options: CacheOptions = {}): Promise<number> {
    const fullPattern = this.buildKey(pattern, options.prefix);
    let deletedCount = 0;

    try {
      if (this.isConnected && this.redis) {
        const keys = await this.redis.keys(fullPattern);
        if (keys.length > 0) {
          deletedCount = await this.redis.del(...keys);
        }
      }

      // Also clean fallback cache
      const fallbackKeys = Array.from(this.fallbackCache.keys())
        .filter(key => key.match(fullPattern.replace('*', '.*')));
      
      fallbackKeys.forEach(key => this.fallbackCache.delete(key));
      
      return deletedCount + fallbackKeys.length;
    } catch (error) {
      console.error('Cache pattern invalidation error:', error);
      return 0;
    }
  }

  // Specific cache methods for the application
  async cacheStudentRecommendations(eleveId: number, exercices: any[], ttl: number = 1800): Promise<void> {
    await this.set(`recommendations:${eleveId}`, exercices, { ttl, prefix: 'student' });
  }

  async getCachedStudentRecommendations(eleveId: number): Promise<any[] | null> {
    return await this.get(`recommendations:${eleveId}`, { prefix: 'student' });
  }

  async cacheStudentProgress(eleveId: number, progress: any, ttl: number = 3600): Promise<void> {
    await this.set(`progress:${eleveId}`, progress, { ttl, prefix: 'student' });
  }

  async getCachedStudentProgress(eleveId: number): Promise<any | null> {
    return await this.get(`progress:${eleveId}`, { prefix: 'student' });
  }

  async cacheExerciseHierarchy(niveau: string, data: any, ttl: number = 86400): Promise<void> {
    await this.set(`hierarchy:${niveau}`, data, { ttl, prefix: 'content' });
  }

  async getCachedExerciseHierarchy(niveau: string): Promise<any | null> {
    return await this.get(`hierarchy:${niveau}`, { prefix: 'content' });
  }

  async invalidateStudentCache(eleveId: number): Promise<void> {
    await this.invalidatePattern(`student:*:${eleveId}`);
    await this.invalidatePattern(`student:recommendations:${eleveId}`);
    await this.invalidatePattern(`student:progress:${eleveId}`);
  }

  // Cache statistics
  async getCacheStats(): Promise<any> {
    try {
      if (this.isConnected && this.redis) {
        const info = await this.redis.info('memory');
        const keyspace = await this.redis.info('keyspace');
        
        return {
          connected: true,
          memory: this.parseRedisInfo(info),
          keyspace: this.parseRedisInfo(keyspace),
          fallbackCacheSize: this.fallbackCache.size
        };
      } else {
        return {
          connected: false,
          fallbackCacheSize: this.fallbackCache.size,
          message: 'Using fallback memory cache'
        };
      }
    } catch (error) {
      return {
        connected: false,
        error: (error as Error).message,
        fallbackCacheSize: this.fallbackCache.size
      };
    }
  }

  private buildKey(key: string, prefix?: string): string {
    const parts = ['reved'];
    if (prefix) parts.push(prefix);
    parts.push(key);
    return parts.join(':');
  }

  private getFromFallback<T>(key: string): T | null {
    const cached = this.fallbackCache.get(key);
    if (!cached) return null;
    
    if (Date.now() > cached.expires) {
      this.fallbackCache.delete(key);
      return null;
    }
    
    return cached.value;
  }

  private setInFallback(key: string, value: any, ttl: number): void {
    const expires = Date.now() + (ttl * 1000);
    this.fallbackCache.set(key, { value, expires });
    
    // Clean expired entries periodically
    if (this.fallbackCache.size > 1000) {
      this.cleanupFallbackCache();
    }
  }

  private cleanupFallbackCache(): void {
    const now = Date.now();
    for (const [key, item] of this.fallbackCache.entries()) {
      if (now > item.expires) {
        this.fallbackCache.delete(key);
      }
    }
  }

  private parseRedisInfo(info: string): any {
    const result: any = {};
    info.split('\n').forEach(line => {
      const [key, value] = line.split(':');
      if (key && value) {
        result[key.trim()] = value.trim();
      }
    });
    return result;
  }

  // Graceful shutdown
  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.isConnected = false;
    }
    this.fallbackCache.clear();
  }
}

// Singleton instance
export const cacheService = new CacheService();

// Cache middleware for Express
export const cacheMiddleware = (ttl: number = 3600, prefix?: string) => {
  return async (req: any, res: any, next: any) => {
    // Skip cache for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = `${req.originalUrl}:${JSON.stringify(req.query)}`;
    
    try {
      const cacheOptions: CacheOptions = { ttl };
      if (prefix) {
        cacheOptions.prefix = prefix;
      }
      
      const cached = await cacheService.get(cacheKey, cacheOptions);
      
      if (cached) {
        res.set('X-Cache', 'HIT');
        return res.json(cached);
      }

      // Capture original response
      const originalSend = res.json;
      res.json = function(data: any) {
        if (res.statusCode === 200) {
          cacheService.set(cacheKey, data, cacheOptions).catch(err => 
            console.error('Cache set error in middleware:', err)
          );
        }
        res.set('X-Cache', 'MISS');
        return originalSend.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
}; 