const SPOTIFY_API = 'https://api.spotify.com/v1';
const SPOTIFY_ACCOUNTS = 'https://accounts.spotify.com';

// --- In-Memory TTL Cache ---
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const cache = new Map<string, { data: any; expiresAt: number }>();

function cacheGet<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function cacheSet(key: string, data: any, ttl = CACHE_TTL): void {
  cache.set(key, { data, expiresAt: Date.now() + ttl });
  // Lazy eviction: prune expired entries when cache grows large
  if (cache.size > 500) {
    const now = Date.now();
    for (const [k, v] of cache) {
      if (now > v.expiresAt) cache.delete(k);
    }
  }
}

// Client credentials token cache (no user login needed)
let clientTokenCache: { token: string; expiresAt: number } | null = null;

export async function getClientToken(clientId: string, clientSecret: string): Promise<string> {
  if (clientTokenCache && clientTokenCache.expiresAt > Date.now() + 60000) {
    return clientTokenCache.token;
  }
  const res = await fetch(`${SPOTIFY_ACCOUNTS}/api/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  if (!res.ok) {
    throw new Error(`Client credentials failed: ${await res.text()}`);
  }
  const data = await res.json() as { access_token: string; expires_in: number };
  clientTokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return data.access_token;
}

export async function spotifyFetch(path: string, accessToken: string) {
  const url = `${SPOTIFY_API}${path}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const body = await res.text();

    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get('Retry-After') || '2', 10);
      await new Promise((r) => setTimeout(r, retryAfter * 1000));
      const retry = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (retry.ok) return retry.json();
      const retryBody = await retry.text();
      throw Object.assign(new Error(`Spotify API ${retry.status}: ${retryBody}`), { status: retry.status });
    }

    throw Object.assign(new Error(`Spotify API ${res.status}: ${body}`), { status: res.status });
  }

  return res.json();
}

export async function exchangeCode(code: string, redirectUri: string, clientId: string, clientSecret: string) {
  const res = await fetch(`${SPOTIFY_ACCOUNTS}/api/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Token exchange failed: ${body}`);
  }
  return res.json() as Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
  }>;
}

export async function refreshAccessToken(refreshToken: string, clientId: string, clientSecret: string) {
  const res = await fetch(`${SPOTIFY_ACCOUNTS}/api/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Token refresh failed: ${body}`);
  }
  return res.json() as Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  }>;
}

export async function getMe(accessToken: string) {
  return spotifyFetch('/me', accessToken) as Promise<{
    id: string;
    display_name: string;
    email: string;
  }>;
}

export async function searchTracks(query: string, accessToken: string, limit = 8) {
  const safeLimit = Math.min(Math.max(Math.floor(limit) || 8, 1), 10);
  return spotifyFetch(
    `/search?q=${encodeURIComponent(query)}&type=track,artist&limit=${safeLimit}&market=US`,
    accessToken
  );
}

export async function getTrack(trackId: string, accessToken: string) {
  return spotifyFetch(`/tracks/${trackId}?market=US`, accessToken);
}

type ArtistStub = { name: string; popularity: number };

export async function getRelatedArtists(artistId: string, accessToken: string): Promise<ArtistStub[]> {
  if (!artistId) return [];
  const cacheKey = `related:${artistId}`;
  const cached = cacheGet<ArtistStub[]>(cacheKey);
  if (cached) return cached;
  const data: any = await spotifyFetch(`/artists/${artistId}/related-artists`, accessToken);
  const artists: any[] = data.artists || [];
  // Return all related artists — no popularity sort so we don't always get superstars
  const result: ArtistStub[] = artists.map((a: any) => ({ name: a.name, popularity: a.popularity ?? 50 }));
  cacheSet(cacheKey, result);
  return result;
}

export async function getArtist(artistId: string, accessToken: string): Promise<{ name: string; genres: string[]; popularity: number }> {
  const cacheKey = `artist:${artistId}`;
  const cached = cacheGet<{ name: string; genres: string[]; popularity: number }>(cacheKey);
  if (cached) return cached;
  const data: any = await spotifyFetch(`/artists/${artistId}`, accessToken);
  const result = { name: data.name, genres: data.genres || [], popularity: data.popularity ?? 50 };
  cacheSet(cacheKey, result);
  return result;
}

/** Search artists by genre tag, with optional era filter via Spotify's year: operator. */
export async function searchArtistsByGenre(
  genre: string,
  accessToken: string,
  limit = 10,
  yearRange?: [number, number],
): Promise<ArtistStub[]> {
  const yearClause = yearRange ? ` year:${yearRange[0]}-${yearRange[1]}` : '';
  const cacheKey = `genre:${genre}:${limit}:${yearRange?.[0] ?? 'any'}`;
  const cached = cacheGet<ArtistStub[]>(cacheKey);
  if (cached) return cached;
  const safeLimit = Math.min(limit, 10);
  const q = encodeURIComponent(`genre:"${genre}"${yearClause}`);
  const data: any = await spotifyFetch(
    `/search?q=${q}&type=artist&limit=${safeLimit}&market=US`,
    accessToken
  );
  const result: ArtistStub[] = (data.artists?.items || []).map((a: any) => ({
    name: a.name,
    popularity: a.popularity ?? 50,
  }));
  cacheSet(cacheKey, result, yearRange ? 6 * 60 * 60 * 1000 : CACHE_TTL); // shorter TTL for era searches
  return result;
}

export async function getArtistTopTracks(artistId: string, accessToken: string): Promise<Array<{ name: string; artists: string[] }>> {
  const cacheKey = `toptracks:${artistId}`;
  const cached = cacheGet<Array<{ name: string; artists: string[] }>>(cacheKey);
  if (cached) return cached;
  const data: any = await spotifyFetch(`/artists/${artistId}/top-tracks?market=US`, accessToken);
  const result = (data.tracks || []).map((t: any) => ({
    name: t.name,
    artists: (t.artists || []).map((a: any) => a.name),
  }));
  cacheSet(cacheKey, result, 12 * 60 * 60 * 1000); // 12h TTL for top tracks
  return result;
}

/**
 * Creative Cascade — 3-step decoy generation.
 *
 * Step 1 (Musical DNA):   Genre-tag search with era filter so decoys share the sonic vibe.
 * Step 2 (Related):       Spotify's related-artists graph, popularity-band filtered.
 * Step 3 (Broad Genre):   Same genres, relaxed constraints, no era restriction.
 *
 * Never uses hardcoded artist lists. Always Spotify-derived.
 */
export async function generateDecoys(
  artistId: string,
  realArtistName: string,
  releaseYear: number | null,
  accessToken: string
): Promise<string[]> {
  // Exclusion set handles "Artist A, Artist B" multi-artist track names
  const realNames = new Set(realArtistName.split(', ').map(n => n.toLowerCase().trim()));
  const isNotReal = (name: string) => !realNames.has(name.toLowerCase().trim());

  // --- Fetch Musical DNA: genres + popularity of the real artist ---
  let artistGenres: string[] = [];
  let artistPopularity = 50;
  try {
    const data = await getArtist(artistId, accessToken);
    artistGenres = data.genres;
    artistPopularity = data.popularity;
  } catch (err: any) {
    console.error('[generateDecoys] Artist fetch failed:', err.message);
  }

  // Decade window for era filtering  (e.g. 2017 → 2010–2019)
  const decadeStart = releaseYear ? Math.floor(releaseYear / 10) * 10 : null;
  const decadeEnd   = decadeStart ? decadeStart + 9 : null;

  // Popularity band: only include artists within ±35 of the real artist's fame.
  // This prevents obscure indie acts from being paired with Billie Eilish.
  const popMin = Math.max(0,   artistPopularity - 35);
  const popMax = Math.min(100, artistPopularity + 35);

  /** Pick 3 unique, valid names from a pool of ArtistStub objects. */
  function pickThree(pool: ArtistStub[], strict = true): string[] | null {
    const seen = new Set<string>();
    const filtered = pool.filter(a => {
      const key = a.name.toLowerCase().trim();
      if (!isNotReal(a.name)) return false;
      if (seen.has(key)) return false;
      if (strict && (a.popularity < popMin || a.popularity > popMax)) return false;
      seen.add(key);
      return true;
    });
    if (filtered.length < 3) return null;
    // Fisher-Yates shuffle — randomise so we don't always get index-0 artists
    for (let i = filtered.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
    }
    return filtered.slice(0, 3).map(a => a.name);
  }

  // ─── Step 1: Musical DNA — genre search with era filter ───────────────────
  if (artistGenres.length > 0) {
    try {
      const pool: ArtistStub[] = [];
      for (const genre of artistGenres.slice(0, 2)) {
        // Era-locked first (same decade): gives the most contextually accurate decoys
        if (decadeStart && decadeEnd) {
          const era = await searchArtistsByGenre(genre, accessToken, 10, [decadeStart, decadeEnd]);
          pool.push(...era);
        }
        // Broad same-genre search as a supplement
        const broad = await searchArtistsByGenre(genre, accessToken, 10);
        pool.push(...broad);
      }
      const picked = pickThree(pool);
      if (picked) {
        console.log(`[generateDecoys] Step 1 (genre DNA: "${artistGenres.slice(0, 2).join(', ')}", decade: ${decadeStart ?? 'any'}):`, picked);
        return picked;
      }
      console.log('[generateDecoys] Step 1 insufficient, trying Step 2');
    } catch (err: any) {
      console.error('[generateDecoys] Step 1 failed:', err.message);
    }
  }

  // ─── Step 2: Related Artists — popularity-band filtered ───────────────────
  try {
    const related = await getRelatedArtists(artistId, accessToken);
    const picked = pickThree(related);
    if (picked) {
      console.log('[generateDecoys] Step 2 (related artists, pop band:', popMin + '-' + popMax + '):', picked);
      return picked;
    }
    // Retry with relaxed popularity (wider band) before moving on
    const relaxed = pickThree(related, false);
    if (relaxed) {
      console.log('[generateDecoys] Step 2 (related artists, relaxed pop):', relaxed);
      return relaxed;
    }
    console.log('[generateDecoys] Step 2 insufficient, trying Step 3');
  } catch (err: any) {
    console.error('[generateDecoys] Step 2 failed:', err.message);
  }

  // ─── Step 3: Broad genre search — all genres, no era or popularity constraint ─
  if (artistGenres.length > 0) {
    try {
      const pool: ArtistStub[] = [];
      for (const genre of artistGenres) {
        const results = await searchArtistsByGenre(genre, accessToken, 10);
        pool.push(...results);
      }
      const picked = pickThree(pool, false); // relaxed — just exclude real artist
      if (picked) {
        console.log('[generateDecoys] Step 3 (broad genre, relaxed):', picked);
        return picked;
      }
    } catch (err: any) {
      console.error('[generateDecoys] Step 3 failed:', err.message);
    }
  }

  // All Spotify steps exhausted — caller logs and returns []
  throw new Error(`generateDecoys: all steps exhausted for artist ${artistId}`);
}

export async function getArtistAlbums(artistId: string, accessToken: string) {
  // First page to get total count
  const first: any = await spotifyFetch(
    `/artists/${artistId}/albums?include_groups=album%2Csingle&limit=10&offset=0&market=US`,
    accessToken
  );

  const allItems = [...(first.items || [])];
  const total = first.total || 0;

  // Fetch remaining pages in parallel (limit=10 per page, max 100 total)
  if (total > 10) {
    const remaining = Math.min(total, 100) - 10;
    const pages = Math.ceil(remaining / 10);
    const fetches = Array.from({ length: pages }, (_, i) =>
      spotifyFetch(
        `/artists/${artistId}/albums?include_groups=album%2Csingle&limit=10&offset=${(i + 1) * 10}&market=US`,
        accessToken
      )
    );
    const results = await Promise.all(fetches);
    for (const page of results) {
      allItems.push(...(page.items || []));
    }
  }

  return allItems.map((album: any) => ({
    id: album.id,
    name: album.name,
    releaseDate: album.release_date,
    image: album.images?.[0]?.url || null,
    totalTracks: album.total_tracks || 0,
  }));
}

export async function getAlbumTracks(albumId: string, accessToken: string) {
  const data: any = await spotifyFetch(`/albums/${albumId}?market=US`, accessToken);
  return {
    id: data.id,
    name: data.name,
    image: data.images?.[0]?.url || null,
    tracks: (data.tracks?.items || []).map((t: any) => ({
      id: t.id,
      title: t.name,
      artist: t.artists.map((a: any) => a.name).join(', '),
      artistId: t.artists[0]?.id || '',
      albumName: data.name,
      albumArt: data.images?.[0]?.url || '',
      duration: t.duration_ms,
      previewUrl: t.preview_url || null,
      spotifyId: t.id,
      hasPreview: !!t.preview_url,
    })),
  };
}
