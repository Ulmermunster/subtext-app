import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import { env } from './config.js';
import { prisma } from './lib/prisma.js';
import { redis, checkRedisHealth } from './lib/redis.js';
import { authRoutes } from './routes/auth.js';
import { spotifyRoutes } from './routes/spotify.js';
import { queRoutes } from './routes/que.js';
import { startCleanupJob } from './jobs/cleanup.js';

const app = Fastify({ logger: true });

// Plugins
await app.register(helmet, {
  contentSecurityPolicy: false, // receiver page uses inline scripts
});

await app.register(cors, {
  origin: [env.APP_URL],
  credentials: true,
});

await app.register(cookie, {
  secret: env.SESSION_SECRET,
});

await app.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
});

// Routes
await app.register(authRoutes);
await app.register(spotifyRoutes);
await app.register(queRoutes);

// Rate limit overrides for specific routes
app.addHook('onRoute', (routeOptions) => {
  if (routeOptions.url === '/vibes/create' && routeOptions.method === 'POST') {
    routeOptions.config = { ...routeOptions.config, rateLimit: { max: 10, timeWindow: '1 minute' } };
  }
  if (routeOptions.url === '/vibes/:id/react' && routeOptions.method === 'POST') {
    routeOptions.config = { ...routeOptions.config, rateLimit: { max: 5, timeWindow: '1 minute' } };
  }
});

// Health check
app.get('/health', async () => ({ status: 'ok' }));

// Serve frontend in production
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webDistPath = path.resolve(__dirname, '../../web/dist');

if (fs.existsSync(webDistPath)) {
  await app.register(fastifyStatic, {
    root: webDistPath,
    prefix: '/',
    wildcard: false,
  });

  // SPA fallback for client-side routing
  app.setNotFoundHandler(async (request, reply) => {
    const url = request.url;

    // API routes should 404, not serve the SPA
    if (url.startsWith('/vibes/') || url.startsWith('/auth/') ||
        url.startsWith('/spotify/') || url.startsWith('/health')) {
      return reply.status(404).send({ error: 'Not found' });
    }

    // Everything else (including /v/:id receiver): serve React SPA
    return reply.sendFile('index.html');
  });
}

// Graceful shutdown
const shutdown = async () => {
  console.log('Shutting down...');
  await app.close();
  await prisma.$disconnect();
  redis.disconnect();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start
async function start() {
  try {
    await checkRedisHealth();
    await prisma.$connect();
    console.log('Database connected');

    startCleanupJob();

    const port = parseInt(process.env.PORT || '3001');
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`Que API server running on port ${port}`);
  } catch (err) {
    console.error('Failed to start:', err);
    process.exit(1);
  }
}

start();
