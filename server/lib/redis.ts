import IORedis from 'ioredis';

// Initialize Redis client with default configuration
const redis = new IORedis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: 3,
});

// Handle Redis connection events
redis.on('connect', () => {
  console.log('Connected to Redis');
});

redis.on('error', (error) => {
  console.error('Redis connection error:', error);
});

// Default cache expiration time (in seconds)
export const DEFAULT_CACHE_TTL = 300; // 5 minutes

// Helper function to create cache key
export const createCacheKey = (prefix: string, params: Record<string, any> = {}) => {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join(':');
  return `${prefix}:${sortedParams}`;
};

export default redis;
