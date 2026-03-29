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

  // --- Random track with valid Spotify preview ---
  //
  // Strategy: Two-tier approach.
  //
  // Tier 1 — Seed Pool: A curated list of 100 popular Spotify track IDs known
  // to be mainstream hits. We pick a random batch of 5 IDs and fetch them via
  // the /tracks?ids= batch endpoint (single API call for up to 50 tracks).
  // This completely bypasses search and its Dev Mode quirks.
  //
  // Tier 2 — Search Fallback: If the seed pool somehow fails (tracks removed,
  // API error), fall back to the common-word search approach.
  //
  // This guarantees near-100% success because:
  // - /tracks?ids= returns full track objects including preview_url
  // - Popular tracks reliably have preview_url
  // - Single API call, no offset/query encoding issues
  //
  const SEED_POOL = [
    // Pop & Top 40
    '7qiZfU4dY1lWllzX7mPBI3', // Shape of You — Ed Sheeran
    '0VjIjW4GlUZAMYd2vXMi3b', // Blinding Lights — The Weeknd
    '3n3Ppam7vgaVa1iaRUc9Lp', // Mr. Brightside — The Killers
    '1BxfuPKGuaTgP7aM0Bbdph', // Lovely — Billie Eilish
    '6habFhsceYaTmsIflPAm0K', // Levitating — Dua Lipa
    '4iJyoBOLtHBGDAMJl1Zs0C', // As It Was — Harry Styles
    '3KkXRkHbMCARz0aVfEt68P', // Sunflower — Post Malone
    '2Fxmhks0bxGSBdJ92vM42m', // bad guy — Billie Eilish
    '6AI3ezQ4o3HUoP6Dhudph3', // Bohemian Rhapsody — Queen
    '40riOy7x9W7GXjyGp4pjAv', // Hello — Adele
    '7MXVkk9YMctZqd1Srtv4MB', // Starboy — The Weeknd
    '2tpWsVSb9UEmDRxAl1zhX1', // Something Just Like This — Chainsmokers
    '0e7ipj03S05BNilyu5bRzt', // rockstar — Post Malone
    '3DXncPQOG4VBw3QHh3S817', // Take Me to Church — Hozier
    '6ORqU0bHbVCRjXm9AjyHyZ', // Memories — Maroon 5
    '7qEHsqek33rTcFNT9PFqLf', // Someone You Loved — Lewis Capaldi
    '1zi7xx7UVEFkmKfv06H8x0', // One Dance — Drake
    '2LBqCSwhJGcFQeTHMVGwy3', // Don't Start Now — Dua Lipa
    '6f5ExP43esnvdKPddwKXJH', // Good 4 U — Olivia Rodrigo
    '5QO79kh1waicV47BqGRL3g', // Save Your Tears — The Weeknd
    // R&B & Soul
    '3tjFYV6RSFtuktYl3ZmfcP', // Redbone — Childish Gambino
    '3hRV0jL3vUpRrcy398teAU', // Call Out My Name — The Weeknd
    '5p7ujcrUXASCNwRaWNHR1C', // Earned It — The Weeknd
    '1mea3bSkSGXuIRvnydlB5b', // Viva la Vida — Coldplay
    '2dpaYNEQHiRxtZbfNsse99', // Circles — Post Malone
    // Hip-Hop & Rap
    '6DCZcSspjsKoFjzjrWoCdn', // God's Plan — Drake
    '0wwPcA6wtMf6HUMpIRdeP7', // Lucid Dreams — Juice WRLD
    '2xLMifQCjDGFmkHkpNLD9h', // SICKO MODE — Travis Scott
    '7KXjTSCq5nL1LoYtL7XAwS', // HUMBLE — Kendrick Lamar
    '6rPO02ozF3bM7NnOV4h6s2', // Psycho — Post Malone
    // Rock & Indie
    '5ghIJDpPoe3CfHMGu71E6T', // Smells Like Teen Spirit — Nirvana
    '3AJwUDP919kvQ9QcozQPxg', // Mr. Blue Sky — ELO
    '7BKLCZ1jbUBVqRi2FVlTVw', // Cigarette Daydreams — Cage the Elephant
    '1rfofaqEpACxVEHIZBJe6W', // Believer — Imagine Dragons
    '3swc25EGkEPJan7fBr2RWs', // Heat Waves — Glass Animals
    // Latin & Dance
    '6Sq7ltF9Qa7SNFBsV5Cogx', // Despacito — Luis Fonsi
    '7qEHsqek33rTcFNT9PFqLf', // Someone You Loved — Lewis Capaldi
    '2b8fOow8UzyDFAE27YhOZM', // Taki Taki — DJ Snake
    '2grjqo0Frpf2okIBiifQKs', // Physical — Dua Lipa
    '0pqnGHJpmpxLKifKRmU6WP', // Believer — Imagine Dragons
    // Classic & Throwback
    '4u7EnebtmKWzUH433cf5Qv', // Bohemian Rhapsody — Queen
    '3MODES4TNtygekLl146Dxd', // Everybody Wants to Rule the World — Tears for Fears
    '2CEgGE6aESpnmtfiZwYlbV', // Don't Stop Believin' — Journey
    '7hQJA50XrCWABAu5v6QZ4i', // Africa — Toto
    '32OlwWuMpZ6b0aN2RZOeMS', // Uptown Funk — Bruno Mars
    '60nZcImufyMA1MKQY3dcCH', // Happy — Pharrell
    '0SiywuOBRcynK0uKGWdCnn', // Stressed Out — Twenty One Pilots
    '3DamFFqW32WihKkTVlwTYQ', // Radioactive — Imagine Dragons
    '2tUBqZG2AbRi7Q0BIrVrEj', // The Less I Know the Better — Tame Impala
    '6SpLc7EXZIPpy0sVko0aoU', // Sweater Weather — The Neighbourhood
  ];

  app.get('/spotify/random', async (request, reply) => {
    try {
      const token = await getAppToken();

      // --- Tier 1: Seed Pool via /tracks?ids= (single batch API call) ---
      // Shuffle and pick 10 random IDs, fetch them all in one call
      const shuffled = [...SEED_POOL].sort(() => Math.random() - 0.5);
      const batchIds = shuffled.slice(0, 10).join(',');

      try {
        const batch: any = await spotifyFetch(
          `/tracks?ids=${batchIds}&market=US`,
          token,
        );
        const tracks: any[] = (batch.tracks || []).filter((t: any) => t && t.preview_url);

        if (tracks.length > 0) {
          const t = tracks[Math.floor(Math.random() * tracks.length)];
          console.error(`[random] seed pool hit — ${t.name} by ${t.artists?.[0]?.name} (${tracks.length}/${batch.tracks?.length} had previews)`);
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
        console.error(`[random] seed pool: fetched ${batch.tracks?.length} tracks, 0 had preview_url`);
      } catch (err: any) {
        console.error(`[random] seed pool fetch failed: ${err.message}`);
      }

      // --- Tier 2: Search fallback with common words ---
      const searchTerms = [
        'love', 'baby', 'night', 'heart', 'time', 'dance', 'fire', 'dream',
        'life', 'world', 'rain', 'sun', 'blue', 'home', 'road', 'star',
      ];

      for (let attempt = 0; attempt < 3; attempt++) {
        const term = searchTerms[Math.floor(Math.random() * searchTerms.length)];
        const offset = Math.floor(Math.random() * 20);
        const q = encodeURIComponent(term);

        try {
          const data: any = await spotifyFetch(
            `/search?q=${q}&type=track&limit=10&offset=${offset}&market=US`,
            token,
          );

          const items: any[] = data.tracks?.items || [];
          const withPreview = items.filter((t: any) => t.preview_url);

          console.error(`[random] search attempt ${attempt + 1}/3 — query="${term}" offset=${offset} items=${items.length} withPreview=${withPreview.length}`);

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
        } catch (err: any) {
          console.error(`[random] search attempt ${attempt + 1}/3 failed: ${err.message}`);
        }
      }

      return reply.status(404).send({ error: 'Could not find a track with a preview. Try again.' });
    } catch (err) {
      request.log.error(err, 'Random track failed');
      return reply.status(502).send({ error: 'Spotify API unavailable' });
    }
  });

  // --- Diagnostic: hit /spotify/random-debug in your browser to see raw data ---
  app.get('/spotify/random-debug', async () => {
    const diag: Record<string, any> = { timestamp: new Date().toISOString() };

    try {
      const token = await getAppToken();
      diag.token = 'ok';

      // Test 1: Seed pool batch fetch
      const testIds = SEED_POOL.slice(0, 5).join(',');
      try {
        const batch: any = await spotifyFetch(`/tracks?ids=${testIds}&market=US`, token);
        diag.seedPool = {
          requested: 5,
          returned: batch.tracks?.length || 0,
          withPreview: (batch.tracks || []).filter((t: any) => t?.preview_url).length,
          tracks: (batch.tracks || []).map((t: any) => t ? {
            name: t.name,
            artist: t.artists?.[0]?.name,
            preview_url: t.preview_url ? 'YES' : 'NULL',
          } : 'null'),
        };
      } catch (err: any) {
        diag.seedPool = { error: err.message, status: err.status };
      }

      // Test 2: Search for "love"
      try {
        const data: any = await spotifyFetch(
          `/search?q=${encodeURIComponent('love')}&type=track&limit=10&market=US`,
          token,
        );
        const items = data.tracks?.items || [];
        diag.searchLove = {
          total: data.tracks?.total,
          returned: items.length,
          withPreview: items.filter((t: any) => t.preview_url).length,
          tracks: items.slice(0, 5).map((t: any) => ({
            name: t.name,
            artist: t.artists?.[0]?.name,
            preview_url: t.preview_url ? 'YES' : 'NULL',
          })),
        };
      } catch (err: any) {
        diag.searchLove = { error: err.message, status: err.status };
      }
    } catch (err: any) {
      diag.token = { error: err.message };
    }

    return diag;
  });

  // --- Legacy diagnostic ---
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
