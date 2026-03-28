import Redis from 'ioredis';
import { env } from '../config.js';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 1,
  connectTimeout: 5000,
  commandTimeout: 3000,
  retryStrategy(times) {
    if (times > 3) return null; // stop retrying after 3 attempts
    return Math.min(times * 500, 2000);
  },
  lazyConnect: false,
  enableReadyCheck: true,
});

redis.on('error', (err) => {
  console.warn('[Redis] Connection error:', err.message);
});

export async function checkRedisHealth(): Promise<void> {
  try {
    const pong = await redis.ping();
    if (pong === 'PONG') {
      console.log('Redis connected');
      return;
    }
  } catch (err) {
    console.warn('[Redis] Health check failed, continuing without cache:', err);
  }
  // Don't throw — app should work without Redis (just no caching)
  console.warn('[Redis] Cache unavailable — app will work without caching');
}
