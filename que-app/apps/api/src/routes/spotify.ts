import { FastifyInstance } from 'fastify';
import { searchTracks, getTrack, getArtistAlbums, getAlbumTracks, getClientToken } from '../lib/spotify.js';
import { env } from '../config.js';

async function getAppToken() {
  return getClientToken(env.SPOTIFY_CLIENT_ID, env.SPOTIFY_CLIENT_SECRET);
}

export async function spotifyRoutes(app: FastifyInstance) {
  // --- Search ---
  app.get('/spotify/search', async (request, reply) => {
    const { q, limit } = request.query as { q: string; limit?: string };
    if (!q) return { tracks: [], artists: [] };

    try {
      const token = await getAppToken();
      // Spotify Feb 2026: Dev Mode search limit max is 10
      const safeLimit = Math.min(Math.max(parseInt(limit || '8', 10) || 8, 1), 10);
      const data = await searchTracks(q, token, safeLimit);

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
    } catch (err) {
      request.log.error(err, 'Spotify search failed');
      return reply.status(502).send({ error: 'Spotify API unavailable' });
    }
  });

  // --- Single track ---
  app.get('/spotify/track/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const token = await getAppToken();
      const t = await getTrack(id, token);
      return {
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
    } catch (err) {
      request.log.error(err, 'Spotify track fetch failed');
      return reply.status(502).send({ error: 'Spotify API unavailable' });
    }
  });

  // --- Artist albums ---
  app.get('/spotify/artist/:id/albums', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const token = await getAppToken();
      const albums = await getArtistAlbums(id, token);
      return albums;
    } catch (err: any) {
      request.log.error({ artistId: id, msg: err.message, status: err.status }, 'Artist albums failed');
      return reply.status(502).send({ error: 'Could not load artist discography' });
    }
  });

  // --- Album tracks ---
  app.get('/spotify/album/:id/tracks', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const token = await getAppToken();
      return await getAlbumTracks(id, token);
    } catch (err: any) {
      request.log.error({ albumId: id, msg: err.message, status: err.status }, 'Album tracks failed');
      return reply.status(502).send({ error: 'Could not load album tracks' });
    }
  });

  // --- Diagnostic: hit this in your browser to verify the full chain ---
  app.get('/spotify/test', async () => {
    const diag: Record<string, any> = { timestamp: new Date().toISOString() };

    // 1. Token
    try {
      const t0 = Date.now();
      const token = await getAppToken();
      diag.token = { ok: true, ms: Date.now() - t0 };

      // 2. Spotify artist albums (The Beatles)
      try {
        const t1 = Date.now();
        const albums = await getArtistAlbums('3WrFJ7ztbogyGnTHbHJFl2', token);
        diag.artistAlbums = { ok: true, count: albums.length, ms: Date.now() - t1, first: albums[0]?.name };
      } catch (err: any) {
        diag.artistAlbums = { ok: false, error: err.message, status: err.status };
      }
    } catch (err: any) {
      diag.token = { ok: false, error: err.message };
    }

    return diag;
  });
}
