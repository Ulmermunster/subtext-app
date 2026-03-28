import Redis from 'ioredis';
import { env } from '../config.js';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 1,
  connectTimeout: 3000,
  commandTimeout: 3000,
  retryStrategy(times) {
    if (times > 3) return null; // give up after 3 attempts
    return Math.min(times * 500, 3000);
  },
  enableOfflineQueue: false, // don't queue commands when disconnected
});

// Only log once per error type to avoid spam
let lastErrorMsg = '';
redis.on('error', (err) => {
  if (err.message !== lastErrorMsg) {
    console.warn('[Redis]', err.message);
    lastErrorMsg = err.message;
  }
});

export async function checkRedisHealth(): Promise<void> {
  try {
    const pong = await redis.ping();
    if (pong === 'PONG') {
      console.log('Redis connected');
      return;
    }
  } catch {
    // non-fatal
  }
  console.warn('[Redis] Unavailable — app will run without caching');
}
