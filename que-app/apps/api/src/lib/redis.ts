import Redis from 'ioredis';
import { env } from '../config.js';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  connectTimeout: 5000,
  retryStrategy(times) {
    if (times > 5) return null;
    return Math.min(times * 200, 2000);
  },
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
  } catch (err: any) {
    console.warn('[Redis] Health check failed:', err.message);
  }
  // Don't crash the app — Redis is used for sessions/cleanup, not critical path
  console.warn('[Redis] Continuing without healthy Redis connection');
}
