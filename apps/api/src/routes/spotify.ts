import { FastifyInstance } from 'fastify';
import { searchTracks, getTrack, getArtistAlbums, getAlbumTracks, getClientToken } from '../lib/spotify.js';
import { env } from '../config.js';
import { redis } from '../lib/redis.js';

const CACHE_TTL = 3600; // 1 hour

async function getAppToken() {
  return getClientToken(env.SPOTIFY_CLIENT_ID, env.SPOTIFY_CLIENT_SECRET);
}

async function getCached<T>(key: string): Promise<T | null> {
  try {
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached);
  } catch (err) {
    console.warn('[Cache] Read failed:', err);
  }
  return null;
}

async function setCache(key: string, data: unknown, ttl = CACHE_TTL): Promise<void> {
  try {
    await redis.set(key, JSON.stringify(data), 'EX', ttl);
  } catch (err) {
    console.warn('[Cache] Write failed:', err);
  }
}

export async function spotifyRoutes(app: FastifyInstance) {
  // All routes use client credentials — no user login needed
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

    // Check cache
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
    await setCache(cacheKey, result);
    return result;
  });

  app.get('/spotify/artist/:id/albums', async (request, reply) => {
    const { id } = request.params as { id: string };
    request.log.info({ artistId: id }, 'Fetching artist albums');

    // Check cache
    const cacheKey = `spotify:artist:${id}:albums`;
    const cached = await getCached<any[]>(cacheKey);
    if (cached) {
      request.log.info({ artistId: id, count: cached.length }, 'Artist albums from cache');
      return cached;
    }

    try {
      const token = await getAppToken();
      request.log.info({ artistId: id, tokenLength: token.length }, 'Got client token, calling Spotify');
      const albums = await getArtistAlbums(id, token);
      request.log.info({ artistId: id, count: albums.length }, 'Artist albums fetched successfully');
      await setCache(cacheKey, albums);
      return albums;
    } catch (err: any) {
      request.log.error({
        artistId: id,
        error: err.message,
        status: err.status,
        stack: err.stack,
      }, 'Spotify artist albums fetch failed');
      return reply.status(502).send({
        error: 'Could not load artist discography',
        detail: err.message,
      });
    }
  });

  app.get('/spotify/album/:id/tracks', async (request, reply) => {
    const { id } = request.params as { id: string };

    // Check cache
    const cacheKey = `spotify:album:${id}:tracks`;
    const cached = await getCached<any>(cacheKey);
    if (cached) return cached;

    try {
      const token = await getAppToken();
      const result = await getAlbumTracks(id, token);
      await setCache(cacheKey, result);
      return result;
    } catch (err: any) {
      request.log.error({
        albumId: id,
        error: err.message,
        status: err.status,
      }, 'Spotify album tracks fetch failed');
      return reply.status(502).send({
        error: 'Could not load album tracks',
        detail: err.message,
      });
    }
  });
}
