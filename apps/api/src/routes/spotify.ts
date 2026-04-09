import { FastifyInstance } from 'fastify';
import { searchTracks, spotifyFetch, getTrack, getArtistAlbums, getAlbumTracks, getClientToken, generateDecoys } from '../lib/spotify.js';
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
      const artistName = t.artists.map((a: any) => a.name).join(', ');
      const artistId = t.artists[0]?.id || '';
      const releaseYear = t.album?.release_date
        ? parseInt(t.album.release_date.slice(0, 4), 10) || null
        : null;
      let decoyArtists: string[] = [];
      if (artistId) {
        try {
          decoyArtists = await generateDecoys(artistId, artistName, releaseYear, token);
        } catch (err: any) {
          console.error(`[decoys] All Spotify tiers failed for ${artistId}: ${err.message}`);
        }
      }
      return {
        id: t.id,
        title: t.name,
        artist: artistName,
        artistId,
        albumName: t.album?.name || '',
        albumArt: t.album?.images?.[0]?.url || '',
        duration: t.duration_ms,
        previewUrl: t.preview_url || null,
        spotifyId: t.id,
        hasPreview: !!t.preview_url,
        decoyArtists,
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

  // --- Random track (Hybrid: Spotify metadata + iTunes audio) ---
  //
  // Spotify Dev Mode returns preview_url=null on ALL endpoints.
  // Strategy: use Spotify /search for metadata (title, artist, art, IDs),
  // then resolve a playable preview from iTunes server-side.
  // The client never sees iTunes — the returned object is a standard
  // Spotify track shape with a working previewUrl.
  //
  app.get('/spotify/random', async (request, reply) => {
    const { genre, decoys: wantDecoys } = request.query as { genre?: string; decoys?: string };
    const needDecoys = wantDecoys === 'true';

    const searchTerms = [
      'love', 'baby', 'night', 'heart', 'time', 'dance', 'fire', 'dream',
      'life', 'world', 'rain', 'sun', 'blue', 'home', 'road', 'star',
      'girl', 'man', 'rock', 'soul', 'feel', 'high', 'stay', 'gone',
    ];

    async function resolvePreview(title: string, artist: string): Promise<string | null> {
      try {
        const term = encodeURIComponent(`${artist} ${title}`);
        const res = await fetch(
          `https://itunes.apple.com/search?term=${term}&entity=song&limit=1`,
        );
        if (!res.ok) return null;
        const data = await res.json() as { results: Array<{ previewUrl?: string }> };
        return data.results?.[0]?.previewUrl || null;
      } catch {
        return null;
      }
    }

    try {
      const token = await getAppToken();

      for (let attempt = 0; attempt < 3; attempt++) {
        const term = searchTerms[Math.floor(Math.random() * searchTerms.length)];
        const offset = Math.floor(Math.random() * 20);
        // If genre is specified, combine it with the random term for more relevant results
        const searchQuery = genre ? `${term} genre:${genre}` : term;
        const q = encodeURIComponent(searchQuery);

        let items: any[];
        try {
          const data: any = await spotifyFetch(
            `/search?q=${q}&type=track&limit=10&offset=${offset}&market=US`,
            token,
          );
          items = data.tracks?.items || [];
        } catch (err: any) {
          console.error(`[random] search attempt ${attempt + 1}/3 failed: ${err.message}`);
          continue;
        }

        if (items.length === 0) {
          console.error(`[random] attempt ${attempt + 1}/3 — query="${term}" offset=${offset} returned 0 items`);
          continue;
        }

        // Shuffle the batch
        for (let i = items.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [items[i], items[j]] = [items[j], items[i]];
        }

        // Walk through shuffled tracks, resolve audio for each
        for (const t of items) {
          const artistName = t.artists.map((a: any) => a.name).join(', ');

          // Use Spotify preview if available (unlikely in Dev Mode, but check)
          let previewUrl = t.preview_url || null;

          // Resolve audio server-side
          if (!previewUrl) {
            previewUrl = await resolvePreview(t.name, artistName);
          }

          if (previewUrl) {
            console.error(`[random] hit — "${t.name}" by ${artistName}`);
            const artId = t.artists[0]?.id || '';
            const releaseYear = t.album?.release_date
              ? parseInt(t.album.release_date.slice(0, 4), 10) || null
              : null;
            let decoyArtists: string[] = [];
            if (needDecoys && artId) {
              decoyArtists = await generateDecoys(artId, artistName, releaseYear, token);
            }
            return {
              id: t.id,
              title: t.name,
              artist: artistName,
              artistId: artId,
              albumName: t.album?.name || '',
              albumArt: t.album?.images?.[0]?.url || '',
              duration: t.duration_ms,
              previewUrl,
              spotifyId: t.id,
              hasPreview: true,
              decoyArtists,
            };
          }
        }

        console.error(`[random] attempt ${attempt + 1}/3 — no audio resolved for any of ${items.length} tracks (query="${term}")`);
      }

      return reply.status(404).send({ error: 'Could not find a track with a preview. Try again.' });
    } catch (err) {
      request.log.error(err, 'Random track failed');
      return reply.status(502).send({ error: 'Spotify API unavailable' });
    }
  });

  // --- Diagnostic ---
  app.get('/spotify/test', async () => {
    const diag: Record<string, any> = { timestamp: new Date().toISOString() };
    try {
      const t0 = Date.now();
      const token = await getAppToken();
      diag.token = { ok: true, ms: Date.now() - t0 };
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
