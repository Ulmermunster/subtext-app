import { FastifyInstance } from 'fastify';
import { searchTracks, getTrack, getArtistAlbums, getAlbumTracks, getClientToken } from '../lib/spotify.js';
import { env } from '../config.js';
import { redis } from '../lib/redis.js';

const CACHE_TTL = 3600; // 1 hour
const CACHE_TIMEOUT_MS = 2000; // 2 second timeout for Redis ops — never block on cache

/** Race a promise against a timeout. Returns fallback if the promise doesn't resolve in time. */
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

async function getCached<T>(key: string): Promise<T | null> {
  try {
    const cached = await withTimeout(redis.get(key), CACHE_TIMEOUT_MS, null);
    if (cached) return JSON.parse(cached);
  } catch {
    // Cache miss or error — proceed without cache
  }
  return null;
}

async function setCache(key: string, data: unknown, ttl = CACHE_TTL): Promise<void> {
  try {
    await withTimeout(redis.set(key, JSON.stringify(data), 'EX', ttl), CACHE_TIMEOUT_MS, undefined);
  } catch {
    // Cache write failed — non-critical
  }
}

async function getAppToken() {
  return getClientToken(env.SPOTIFY_CLIENT_ID, env.SPOTIFY_CLIENT_SECRET);
}

export async function spotifyRoutes(app: FastifyInstance) {
  app.get('/spotify/search', async (request, reply) => {
    const { q, limit } = request.query as { q: string; limit?: string };
    if (!q) return { tracks: [], artists: [] };

    let token, data;
    try {
      token = await getAppToken();
      const safeLimit = Math.min(Math.max(parseInt(limit || '8', 10) || 8, 1), 50);
      data = await searchTracks(q, token, safeLimit);
    } catch (err) {
      request.log.error(err, 'Spotify search failed');
      return reply.status(502).send({ error: 'Spotify API unavailable' });
    }

    const tracks = (data.tracks?.items || []).map((t: any) => ({
      id: t.id,
      title: t.name,
      artist: t.artists.map((a: any) => a.name).join(', '),
      artistId: t.artists[0]?.id || '',
      albumName: t.album?.name || '',
      albumArt: t.album?.images?.[0]?.url || '',
      duration: t.duration_ms,
      previewUrl: t.preview_url || null,
      spotifyId: t.id,
      hasPreview: !!t.preview_url,
    }));

    const artists = (data.artists?.items || []).map((a: any) => ({
      id: a.id,
      name: a.name,
      image: a.images?.[0]?.url || null,
      genres: a.genres || [],
      followers: a.followers?.total || 0,
    }));

    return { tracks, artists };
  });

  app.get('/spotify/track/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const cacheKey = `spotify:track:${id}`;
    const cached = await getCached<any>(cacheKey);
    if (cached) return cached;

    let token, t;
    try {
      token = await getAppToken();
      t = await getTrack(id, token);
    } catch (err) {
      request.log.error(err, 'Spotify track fetch failed');
      return reply.status(502).send({ error: 'Spotify API unavailable' });
    }
    const result = {
      id: t.id,
      title: t.name,
      artist: t.artists.map((a: any) => a.name).join(', '),
      artistId: t.artists[0]?.id || '',
      albumName: t.album?.name || '',
      albumArt: t.album?.images?.[0]?.url || '',
      duration: t.duration_ms,
      previewUrl: t.preview_url || null,
      spotifyId: t.id,
      hasPreview: !!t.preview_url,
    };
    setCache(cacheKey, result); // fire-and-forget, don't await
    return result;
  });

  app.get('/spotify/artist/:id/albums', async (request, reply) => {
    const { id } = request.params as { id: string };
    request.log.info({ artistId: id }, 'Fetching artist albums');

    const cacheKey = `spotify:artist:${id}:albums`;
    const cached = await getCached<any[]>(cacheKey);
    if (cached) {
      request.log.info({ artistId: id, count: cached.length }, 'Artist albums from cache');
      return cached;
    }

    try {
      const token = await getAppToken();
      const albums = await getArtistAlbums(id, token);
      request.log.info({ artistId: id, count: albums.length }, 'Artist albums fetched');
      setCache(cacheKey, albums); // fire-and-forget
      return albums;
    } catch (err: any) {
      request.log.error({ artistId: id, error: err.message, status: err.status }, 'Artist albums failed');
      return reply.status(502).send({ error: 'Could not load artist discography' });
    }
  });

  app.get('/spotify/album/:id/tracks', async (request, reply) => {
    const { id } = request.params as { id: string };

    const cacheKey = `spotify:album:${id}:tracks`;
    const cached = await getCached<any>(cacheKey);
    if (cached) return cached;

    try {
      const token = await getAppToken();
      const result = await getAlbumTracks(id, token);
      setCache(cacheKey, result); // fire-and-forget
      return result;
    } catch (err: any) {
      request.log.error({ albumId: id, error: err.message, status: err.status }, 'Album tracks failed');
      return reply.status(502).send({ error: 'Could not load album tracks' });
    }
  });

  // Diagnostic endpoint — test the full Spotify flow
  app.get('/spotify/test', async (request, reply) => {
    const steps: Record<string, any> = {};
    const beatlesId = '3WrFJ7ztbogyGnTHbHJFl2';

    // Step 1: Redis
    try {
      const start = Date.now();
      const pong = await withTimeout(redis.ping(), 3000, 'TIMEOUT');
      steps.redis = { status: pong, ms: Date.now() - start };
    } catch (err: any) {
      steps.redis = { status: 'ERROR', error: err.message };
    }

    // Step 2: Client token
    try {
      const start = Date.now();
      const token = await getAppToken();
      steps.token = { status: 'OK', length: token.length, ms: Date.now() - start };

      // Step 3: Artist albums API call
      try {
        const start2 = Date.now();
        const albums = await getArtistAlbums(beatlesId, token);
        steps.artistAlbums = { status: 'OK', count: albums.length, ms: Date.now() - start2, sample: albums[0] };
      } catch (err: any) {
        steps.artistAlbums = { status: 'ERROR', error: err.message, httpStatus: err.status };
      }
    } catch (err: any) {
      steps.token = { status: 'ERROR', error: err.message };
    }

    return steps;
  });
}
