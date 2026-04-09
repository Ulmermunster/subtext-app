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
 * Progressive Fallback Cascade — guarantees 3 decoys.
 *
 * CRITICAL: Spotify Dev Mode caps search at limit=10 and returns nothing past
 * offset ~20. All queries use limit=10 and small offsets to mirror the working
 * /spotify/random endpoint exactly. Genre queries use `word genre:X` format
 * (no quotes, no year clause) — the same format the random endpoint uses.
 *
 * Attempt 1: word + artist's specific genre  (contextual)
 * Attempt 2: word + broad genre              (semi-contextual)
 * Attempt 3: plain word searches             (guaranteed — same as /random)
 *
 * Each search is isolated in its own try/catch. Never throws.
 */
export async function generateDecoys(
  artistId: string,
  realArtistName: string,
  _releaseYear: number | null,
  accessToken: string
): Promise<string[]> {
  const realNames = new Set(realArtistName.split(', ').map(n => n.toLowerCase().trim()));
  const seen = new Set<string>();
  const decoys: string[] = [];

  function shuffleArr<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function tryAdd(name: string) {
    const key = name.toLowerCase().trim();
    if (!key || realNames.has(key) || seen.has(key)) return;
    seen.add(key);
    decoys.push(name);
  }

  /**
   * One track search using the EXACT same parameters as /spotify/random:
   * limit=10, offset 0–19, market=US. Collects all artist names from results.
   */
  async function searchTracks(query: string): Promise<void> {
    const offset = Math.floor(Math.random() * 20);
    const data: any = await spotifyFetch(
      `/search?q=${encodeURIComponent(query)}&type=track&limit=10&offset=${offset}&market=US`,
      accessToken,
    );
    for (const track of (data.tracks?.items ?? [])) {
      for (const artist of (track.artists ?? [])) {
        tryAdd(artist.name);
      }
    }
  }

  // Common words pool — same as /spotify/random
  const WORDS = shuffleArr([
    'love', 'baby', 'night', 'heart', 'time', 'dance', 'fire', 'dream',
    'life', 'world', 'rain', 'sun', 'blue', 'home', 'road', 'star',
    'girl', 'feel', 'soul', 'stay', 'gone', 'high', 'rock', 'man',
  ]);

  // Resolve artist genres (best-effort; cascade continues even if this fails)
  let genres: string[] = [];
  try {
    const data = await getArtist(artistId, accessToken);
    genres = sortGenresBySpecificity(data.genres).slice(0, 2);
  } catch (e: any) {
    console.error('[generateDecoys] artist fetch failed:', e.message);
  }

  // ── Attempt 1: word + artist's specific genre ────────────────────────────
  if (genres.length > 0) {
    for (const word of WORDS.slice(0, 6)) {
      if (decoys.length >= 3) break;
      try { await searchTracks(`${word} genre:${genres[0]}`); }
      catch (e: any) { console.error(`[generateDecoys] A1 failed: ${e.message}`); }
    }
  }
  if (decoys.length >= 3) {
    console.log('[generateDecoys] A1 (specific genre):', decoys.slice(0, 3));
    return shuffleArr(decoys).slice(0, 3);
  }

  // ── Attempt 2: word + broad genre ───────────────────────────────────────
  for (const genre of ['pop', 'rock', 'hip-hop', 'r-n-b', 'electronic', 'country', 'soul']) {
    if (decoys.length >= 3) break;
    const word = WORDS[Math.floor(Math.random() * WORDS.length)];
    try { await searchTracks(`${word} genre:${genre}`); }
    catch (e: any) { console.error(`[generateDecoys] A2 failed: ${e.message}`); }
  }
  if (decoys.length >= 3) {
    console.log('[generateDecoys] A2 (broad genre):', decoys.slice(0, 3));
    return shuffleArr(decoys).slice(0, 3);
  }

  // ── Attempt 3: plain word — mirrors /spotify/random, cannot fail ─────────
  for (const word of WORDS) {
    if (decoys.length >= 3) break;
    try { await searchTracks(word); }
    catch (e: any) { console.error(`[generateDecoys] A3 "${word}" failed: ${e.message}`); }
  }

  const result = shuffleArr(decoys).slice(0, 3);
  console.log(`[generateDecoys] result (${result.length}) for "${realArtistName}":`, result);
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
