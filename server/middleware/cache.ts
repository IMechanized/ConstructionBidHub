import { Request, Response, NextFunction } from 'express';
import redis, { DEFAULT_CACHE_TTL, createCacheKey } from '../lib/redis.js';

interface CacheOptions {
  ttl?: number;
  prefix: string;
}

export const cacheMiddleware = ({ ttl = DEFAULT_CACHE_TTL, prefix }: CacheOptions) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Create cache key based on the request path and query parameters
      const cacheKey = createCacheKey(prefix, req.query);

      // Try to get cached data
      const cachedData = await redis.get(cacheKey);
      
      if (cachedData) {
        return res.json(JSON.parse(cachedData));
      }

      // Store the original res.json function
      const originalJson = res.json.bind(res);

      // Override res.json to cache the response before sending
      res.json = ((data: any) => {
        // Cache the response data
        redis.setex(cacheKey, ttl, JSON.stringify(data));
        
        // Call the original json function
        return originalJson(data);
      }) as any;

      next();
    } catch (error) {
      // If Redis fails, continue without caching
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

// Helper function to clear cache by prefix
export const clearCache = async (prefix: string) => {
  try {
    const keys = await redis.keys(`${prefix}:*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};
