import { FastifyInstance } from 'fastify';
import { searchTracks, spotifyFetch, getTrack, getArtistAlbums, getAlbumTracks, getClientToken } from '../lib/spotify.js';
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

  // --- Random track with valid preview (Batch & Filter strategy) ---
  app.get('/spotify/random', async (request, reply) => {
    const wildcards = ['%25a%25', '%25e%25', '%25i%25', '%25o%25', '%25u%25'];
    const yearRanges = [
      'year:1980-1989', 'year:1990-1999', 'year:2000-2009',
      'year:2010-2019', 'year:2020-2025',
    ];
    const maxAttempts = 3;

    try {
      const token = await getAppToken();

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const wildcard = wildcards[Math.floor(Math.random() * wildcards.length)];
        const yearRange = yearRanges[Math.floor(Math.random() * yearRanges.length)];
        const query = `${wildcard} ${yearRange}`;
        // Spotify Dev Mode caps limit at 10, so fetch 10 per page.
        // Use a random offset for variety (stay under 1000 Spotify cap).
        const offset = Math.floor(Math.random() * 500);

        const data: any = await spotifyFetch(
          `/search?q=${query}&type=track&limit=10&offset=${offset}&market=US`,
          token,
        );

        const items = data.tracks?.items || [];
        const withPreviews = items.filter((t: any) => t.preview_url);

        if (withPreviews.length > 0) {
          const t = withPreviews[Math.floor(Math.random() * withPreviews.length)];
          return {
            id: t.id,
            title: t.name,
            artist: t.artists.map((a: any) => a.name).join(', '),
            artistId: t.artists[0]?.id || '',
            albumName: t.album?.name || '',
            albumArt: t.album?.images?.[0]?.url || '',
            duration: t.duration_ms,
            previewUrl: t.preview_url,
            spotifyId: t.id,
            hasPreview: true,
          };
        }

        console.error(
          `[random] attempt ${attempt + 1}/${maxAttempts} empty — query="${query}" offset=${offset} total=${items.length} withPreview=0`
        );
      }

      return reply.status(404).send({ error: 'Could not find a track with a preview. Try again.' });
    } catch (err) {
      request.log.error(err, 'Random track failed');
      return reply.status(502).send({ error: 'Spotify API unavailable' });
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
