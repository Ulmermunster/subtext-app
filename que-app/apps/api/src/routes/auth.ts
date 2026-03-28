import { FastifyInstance } from 'fastify';
import { randomBytes } from 'node:crypto';
import { env } from '../config.js';
import { prisma } from '../lib/prisma.js';
import { redis } from '../lib/redis.js';
import { encrypt, decrypt } from '../lib/crypto.js';
import { exchangeCode, getMe } from '../lib/spotify.js';
import { requireSession } from '../middleware/session.js';

const SCOPES = 'user-read-email user-read-private';

// Allowed returnTo prefixes (prevent open redirect)
const ALLOWED_RETURN_PREFIXES = ['/send', '/v/'];

export async function authRoutes(app: FastifyInstance) {
  app.get('/auth/spotify', async (request, reply) => {
    const { returnTo } = request.query as { returnTo?: string };
    const state = randomBytes(16).toString('hex');
    const safeReturnTo = returnTo && ALLOWED_RETURN_PREFIXES.some(p => returnTo.startsWith(p)) ? returnTo : null;
    await redis.set(`oauth:state:${state}`, JSON.stringify({ v: 1, returnTo: safeReturnTo }), 'EX', 600);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: env.SPOTIFY_CLIENT_ID,
      scope: SCOPES,
      redirect_uri: env.SPOTIFY_REDIRECT_URI,
      state,
    });

    return reply.redirect(`https://accounts.spotify.com/authorize?${params}`);
  });

  app.get('/auth/spotify/callback', async (request, reply) => {
    const { code, state, error } = request.query as Record<string, string>;

    if (error) {
      return reply.redirect(`${env.APP_URL}?error=spotify_denied`);
    }

    const stateRaw = state ? await redis.get(`oauth:state:${state}`) : null;
    if (!state || !stateRaw) {
      return reply.status(400).send({ error: 'Invalid state' });
    }
    let stateData: { v: number; returnTo: string | null };
    try {
      stateData = JSON.parse(stateRaw);
    } catch {
      return reply.status(400).send({ error: 'Invalid state data' });
    }
    await redis.del(`oauth:state:${state}`);

    if (!code) {
      return reply.status(400).send({ error: 'Missing code' });
    }

    let tokens, me;
    try {
      tokens = await exchangeCode(
        code,
        env.SPOTIFY_REDIRECT_URI,
        env.SPOTIFY_CLIENT_ID,
        env.SPOTIFY_CLIENT_SECRET
      );
      me = await getMe(tokens.access_token);
    } catch (err) {
      request.log.error(err, 'Spotify auth failed');
      return reply.redirect(`${env.APP_URL}?error=spotify_auth_failed`);
    }

    const sessionId = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    // Store in DB
    await prisma.session.create({
      data: {
        id: sessionId,
        spotifyAccessToken: encrypt(tokens.access_token),
        spotifyRefreshToken: encrypt(tokens.refresh_token),
        spotifyUserId: me.id,
        displayName: me.display_name || me.id,
        tokenExpiresAt,
        expiresAt,
      },
    });

    // Store in Redis
    const sessionData = {
      sessionId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      spotifyUserId: me.id,
      displayName: me.display_name || me.id,
      tokenExpiresAt,
    };
    await redis.set(`session:${sessionId}`, JSON.stringify(sessionData), 'EX', 30 * 24 * 60 * 60);

    reply.setCookie('session', sessionId, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
    });

    const redirectPath = stateData.returnTo || '/send';
    return reply.redirect(`${env.APP_URL}${redirectPath}`);
  });

  app.get('/auth/me', { preHandler: [requireSession] }, async (request) => {
    const session = request.session!;
    return {
      displayName: session.displayName,
      connected: true,
      accessToken: session.accessToken,
    };
  });

  app.post('/auth/logout', async (request, reply) => {
    const sessionId = request.cookies?.session;
    if (sessionId) {
      await redis.del(`session:${sessionId}`);
      await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
      reply.clearCookie('session', { path: '/' });
    }
    return { success: true };
  });
}
