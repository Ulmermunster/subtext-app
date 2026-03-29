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

  // --- Random track with valid preview (Batch & Filter + iTunes fallback) ---
  app.get('/spotify/random', async (request, reply) => {
    // High-frequency English words that appear in millions of song titles —
    // guarantees large result pools even in Spotify Dev Mode.
    const searchTerms = [
      'love', 'baby', 'night', 'heart', 'time', 'dance', 'fire', 'dream',
      'life', 'world', 'rain', 'sun', 'blue', 'home', 'road', 'star',
      'girl', 'man', 'rock', 'soul', 'feel', 'high', 'stay', 'gone',
    ];
    const maxAttempts = 3;

    async function findItunesPreview(title: string, artist: string): Promise<string | null> {
      try {
        const term = encodeURIComponent(`${title} ${artist}`);
        const res = await fetch(`https://itunes.apple.com/search?term=${term}&media=music&limit=3`);
        if (!res.ok) return null;
        const data = await res.json() as { results: Array<{ previewUrl?: string }> };
        return data.results?.[0]?.previewUrl || null;
      } catch {
        return null;
      }
    }

    try {
      const token = await getAppToken();

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const term = searchTerms[Math.floor(Math.random() * searchTerms.length)];
        // Dev Mode result pools are small — keep offset 0-40 to stay in range
        const offset = Math.floor(Math.random() * 40);
        const q = encodeURIComponent(term);

        const data: any = await spotifyFetch(
          `/search?q=${q}&type=track&limit=10&offset=${offset}&market=US`,
          token,
        );

        const items: any[] = data.tracks?.items || [];
        if (items.length === 0) {
          console.error(`[random] attempt ${attempt + 1}/${maxAttempts} — query="${term}" offset=${offset} returned 0 items`);
          continue;
        }

        // Shuffle the batch
        for (let i = items.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [items[i], items[j]] = [items[j], items[i]];
        }

        // First pass: try tracks that already have a Spotify preview_url
        const withPreview = items.filter((t: any) => t.preview_url);
        if (withPreview.length > 0) {
          const t = withPreview[Math.floor(Math.random() * withPreview.length)];
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

        // Second pass: no Spotify previews — try iTunes fallback for up to 3 tracks
        console.error(`[random] attempt ${attempt + 1}/${maxAttempts} — query="${term}" offset=${offset} items=${items.length} spotifyPreviews=0, trying iTunes`);
        const candidates = items.slice(0, 3);
        for (const t of candidates) {
          const artistName = t.artists.map((a: any) => a.name).join(', ');
          const itunesUrl = await findItunesPreview(t.name, artistName);
          if (itunesUrl) {
            return {
              id: t.id,
              title: t.name,
              artist: artistName,
              artistId: t.artists[0]?.id || '',
              albumName: t.album?.name || '',
              albumArt: t.album?.images?.[0]?.url || '',
              duration: t.duration_ms,
              previewUrl: itunesUrl,
              spotifyId: t.id,
              hasPreview: true,
            };
          }
        }

        console.error(`[random] attempt ${attempt + 1}/${maxAttempts} — iTunes fallback also empty for "${term}"`);
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
