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
  const result: ArtistStub[] = artists.map((a: any) => ({ name: a.name, popularity: a.popularity || 50 }));
  cacheSet(cacheKey, result);
  return result;
}

export async function getArtist(artistId: string, accessToken: string): Promise<{ name: string; genres: string[]; popularity: number }> {
  const cacheKey = `artist:${artistId}`;
  const cached = cacheGet<{ name: string; genres: string[]; popularity: number }>(cacheKey);
  if (cached) return cached;
  const data: any = await spotifyFetch(`/artists/${artistId}`, accessToken);
  const result = { name: data.name, genres: data.genres || [], popularity: data.popularity || 50 };
  cacheSet(cacheKey, result);
  return result;
}

/**
 * Search TRACKS by genre + optional year range, then extract unique artists from results.
 *
 * Why tracks instead of artists:
 * - Spotify's artist search (type=artist) returns a static popularity-ranked list —
 *   genre:"pop" always returns Taylor Swift / The Weeknd / Billie Eilish at the top.
 * - The year: filter is largely ignored on artist searches but works correctly on tracks.
 * - Track search surfaces mid-tier and niche artists as primary performers, giving
 *   a much more contextually appropriate decoy pool.
 *
 * A randomised page offset breaks the "always the same top-50" problem.
 */
async function searchArtistsByTrackSearch(
  genre: string,
  accessToken: string,
  yearRange?: [number, number],
): Promise<ArtistStub[]> {
  // 5 possible pages (0-40 offset) so repeated calls for the same genre get variety
  const offset = Math.floor(Math.random() * 5) * 10;
  const yearClause = yearRange ? ` year:${yearRange[0]}-${yearRange[1]}` : '';
  const cacheKey = `trackgen:${genre}:${yearRange?.[0] ?? 'any'}:${offset}`;
  const cached = cacheGet<ArtistStub[]>(cacheKey);
  if (cached) return cached;

  const q = encodeURIComponent(`genre:"${genre}"${yearClause}`);
  const data: any = await spotifyFetch(
    `/search?q=${q}&type=track&limit=50&offset=${offset}&market=US`,
    accessToken
  );

  // Extract unique artists; use the track's popularity as a proxy for the artist's tier
  const seen = new Set<string>();
  const result: ArtistStub[] = [];
  for (const track of (data.tracks?.items ?? [])) {
    const trackPop: number = track.popularity ?? 50;
    for (const artist of (track.artists ?? [])) {
      if (!seen.has(artist.id)) {
        seen.add(artist.id);
        result.push({ name: artist.name, popularity: trackPop || 50 });
      }
    }
  }

  cacheSet(cacheKey, result, 4 * 60 * 60 * 1000); // 4h — fresh enough, cheap enough
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
 * Prefer more specific genre tags ("indie electropop") over broad ones ("pop").
 * Specific tags produce diverse track-search results; broad tags produce the Billboard Hot 100.
 */
function sortGenresBySpecificity(genres: string[]): string[] {
  const BROAD = new Set(['pop', 'rock', 'rap', 'hip hop', 'r&b', 'soul', 'country',
                         'jazz', 'electronic', 'metal', 'folk', 'dance', 'indie']);
  return [...genres].sort((a, b) => {
    const aB = BROAD.has(a.toLowerCase());
    const bB = BROAD.has(b.toLowerCase());
    if (aB !== bB) return aB ? 1 : -1; // specific first
    return b.length - a.length;        // longer name = more specific
  });
}

/**
 * Progressive Fallback Cascade — guarantees exactly 3 decoys.
 *
 * Attempt 1 (Strict):   genre tag + decade year range
 * Attempt 2 (Medium):   decade year range + broad genres, pop ≥ 40
 *                        (in Spotify Dev Mode pop=0, so pop filter is skipped)
 * Attempt 3 (Loose):    broad genres, no year, no pop filter
 * Attempt 4 (Nuclear):  simple word searches — identical to /spotify/random
 *                        which is proven to always return results
 *
 * Each search is isolated in its own try/catch so a single Spotify error
 * cannot abort the whole cascade. Never throws. Always returns 0–3 names.
 */
export async function generateDecoys(
  artistId: string,
  realArtistName: string,
  releaseYear: number | null,
  accessToken: string
): Promise<string[]> {
  // ── Utilities ─────────────────────────────────────────────────────────────
  const realNames = new Set(realArtistName.split(', ').map(n => n.toLowerCase().trim()));

  function shuffleArr<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const seen = new Set<string>();
  const decoys: string[] = [];

  function tryAdd(name: string) {
    const key = name.toLowerCase().trim();
    if (!key || realNames.has(key) || seen.has(key)) return;
    seen.add(key);
    decoys.push(name);
  }

  /** Search tracks for a query, harvest unique artist names into decoys[]. */
  async function harvest(query: string, minPop = 0): Promise<void> {
    const offset = Math.floor(Math.random() * 5) * 10;
    const data: any = await spotifyFetch(
      `/search?q=${encodeURIComponent(query)}&type=track&limit=50&offset=${offset}&market=US`,
      accessToken,
    );
    for (const track of (data.tracks?.items ?? [])) {
      // minPop filter only applied when caller asks for it AND track has real data
      if (minPop > 0 && (track.popularity || 0) < minPop) continue;
      for (const artist of (track.artists ?? [])) {
        tryAdd(artist.name);
      }
    }
  }

  // Resolve artist metadata once
  let genres: string[] = [];
  try {
    const data = await getArtist(artistId, accessToken);
    genres = sortGenresBySpecificity(data.genres).slice(0, 3);
  } catch (err: any) {
    console.error('[generateDecoys] artist fetch failed:', err.message);
  }

  const decadeStart = releaseYear ? Math.floor(releaseYear / 10) * 10 : null;
  const yearRange   = decadeStart ? `${decadeStart}-${decadeStart + 9}` : null;

  // ── Attempt 1: Strict — specific genre + year ────────────────────────────
  if (decoys.length < 3 && genres.length > 0 && yearRange) {
    for (const genre of genres) {
      if (decoys.length >= 3) break;
      try { await harvest(`genre:"${genre}" year:${yearRange}`); }
      catch (e: any) { console.error('[generateDecoys] A1 failed:', e.message); }
    }
    if (decoys.length >= 3) {
      console.log('[generateDecoys] Attempt 1 (strict genre+year):', decoys.slice(0, 3));
      return shuffleArr(decoys).slice(0, 3);
    }
  }

  // ── Attempt 2: Medium — broad genre + year, pop ≥ 40 ────────────────────
  // pop filter is a no-op in Spotify Dev Mode (all pops = 0) but helps in prod
  if (decoys.length < 3 && yearRange) {
    for (const genre of ['pop', 'rock', 'hip-hop', 'r-n-b', 'electronic', 'country']) {
      if (decoys.length >= 3) break;
      try { await harvest(`genre:"${genre}" year:${yearRange}`, 40); }
      catch (e: any) { console.error('[generateDecoys] A2 failed:', e.message); }
    }
    if (decoys.length >= 3) {
      console.log('[generateDecoys] Attempt 2 (medium year+pop):', decoys.slice(0, 3));
      return shuffleArr(decoys).slice(0, 3);
    }
  }

  // ── Attempt 3: Loose — broad genres, no year, no pop filter ─────────────
  if (decoys.length < 3) {
    for (const genre of ['pop', 'rock', 'hip-hop', 'r-n-b', 'soul', 'electronic', 'country']) {
      if (decoys.length >= 3) break;
      try { await harvest(`genre:"${genre}"`); }
      catch (e: any) { console.error('[generateDecoys] A3 failed:', e.message); }
    }
    if (decoys.length >= 3) {
      console.log('[generateDecoys] Attempt 3 (loose genre):', decoys.slice(0, 3));
      return shuffleArr(decoys).slice(0, 3);
    }
  }

  // ── Attempt 4: Nuclear — plain word searches, each isolated ─────────────
  // Same strategy as /spotify/random which is proven to always return tracks.
  // Each word has its own try/catch so one rate-limit can't abort the cascade.
  if (decoys.length < 3) {
    const words = shuffleArr([
      'love', 'baby', 'night', 'heart', 'time', 'dance', 'fire', 'dream',
      'life', 'world', 'rain', 'sun', 'blue', 'home', 'star', 'soul',
    ]);
    for (const word of words) {
      if (decoys.length >= 3) break;
      try { await harvest(word); }
      catch (e: any) { console.error(`[generateDecoys] A4 "${word}" failed:`, e.message); }
    }
  }

  const result = shuffleArr(decoys).slice(0, 3);
  console.log(`[generateDecoys] final result (${result.length} decoys):`, result);
  return result;
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
