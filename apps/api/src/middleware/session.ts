import { FastifyRequest, FastifyReply } from 'fastify';
import { redis } from '../lib/redis.js';
import { decrypt, encrypt } from '../lib/crypto.js';
import { prisma } from '../lib/prisma.js';
import { refreshAccessToken } from '../lib/spotify.js';
import { env } from '../config.js';

export interface SessionData {
  sessionId: string;
  accessToken: string;
  refreshToken: string;
  spotifyUserId: string;
  displayName: string;
  tokenExpiresAt: Date;
}

declare module 'fastify' {
  interface FastifyRequest {
    session?: SessionData;
  }
}

export async function requireSession(request: FastifyRequest, reply: FastifyReply) {
  const sessionId = request.cookies?.session;
  if (!sessionId) {
    return reply.status(401).send({ error: 'Not authenticated' });
  }

  // Try Redis first
  let cached = await redis.get(`session:${sessionId}`);
  let session: SessionData;

  if (cached) {
    session = JSON.parse(cached);
    session.tokenExpiresAt = new Date(session.tokenExpiresAt);
  } else {
    // Fall back to DB
    const dbSession = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!dbSession || dbSession.expiresAt < new Date()) {
      return reply.status(401).send({ error: 'Session expired' });
    }
    session = {
      sessionId: dbSession.id,
      accessToken: decrypt(dbSession.spotifyAccessToken),
      refreshToken: decrypt(dbSession.spotifyRefreshToken),
      spotifyUserId: dbSession.spotifyUserId,
      displayName: dbSession.displayName,
      tokenExpiresAt: dbSession.tokenExpiresAt,
    };
    // Re-cache in Redis
    await redis.set(`session:${sessionId}`, JSON.stringify(session), 'EX', 60 * 60 * 24 * 30);
  }

  // Auto-refresh if token expires within 5 minutes
  if (session.tokenExpiresAt.getTime() - Date.now() < 5 * 60 * 1000) {
    try {
      const refreshed = await refreshAccessToken(
        session.refreshToken,
        env.SPOTIFY_CLIENT_ID,
        env.SPOTIFY_CLIENT_SECRET
      );
      session.accessToken = refreshed.access_token;
      if (refreshed.refresh_token) {
        session.refreshToken = refreshed.refresh_token;
      }
      session.tokenExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000);

      // Update DB
      await prisma.session.update({
        where: { id: sessionId },
        data: {
          spotifyAccessToken: encrypt(session.accessToken),
          spotifyRefreshToken: encrypt(session.refreshToken),
          tokenExpiresAt: session.tokenExpiresAt,
        },
      });

      // Update Redis
      await redis.set(`session:${sessionId}`, JSON.stringify(session), 'EX', 60 * 60 * 24 * 30);
    } catch (err) {
      console.error('Token refresh failed:', err);
      return reply.status(401).send({ error: 'Session expired, please reconnect Spotify' });
    }
  }

  request.session = session;
}
