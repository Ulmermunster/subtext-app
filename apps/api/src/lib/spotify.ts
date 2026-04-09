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
 * Decoy generation — three-tier cascade, no popularity filtering.
 *
 * Step 1: Genre-based track search. Pulls artists from real tracks in the same
 *         genre (and optionally the same decade). No popularity filter — Dev Mode
 *         returns popularity=0 for everything, making filters useless.
 *
 * Step 2: Artist-name track search. Searches tracks that mention the artist,
 *         harvesting featured/collaborative artists from results.
 *
 * Step 3: Random word searches — identical to the working /spotify/random
 *         endpoint. Guaranteed to return results. Last resort only.
 *
 * Never throws. Returns whatever was found (0–3 names); frontend shows
 * however many choices are available.
 */
export async function generateDecoys(
  artistId: string,
  realArtistName: string,
  releaseYear: number | null,
  accessToken: string
): Promise<string[]> {
  const realNames = new Set(realArtistName.split(', ').map(n => n.toLowerCase().trim()));
  const isNotReal = (name: string) => !realNames.has(name.toLowerCase().trim());

  function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const seen = new Set<string>();
  const pool: string[] = [];

  function collect(names: string[]) {
    for (const name of names) {
      const key = name.toLowerCase().trim();
      if (key && isNotReal(name) && !seen.has(key)) {
        seen.add(key);
        pool.push(name);
      }
    }
  }

  // ── Step 1: Genre-based track search ────────────────────────────────────
  try {
    const artistData = await getArtist(artistId, accessToken);
    const genres = sortGenresBySpecificity(artistData.genres).slice(0, 3);
    if (genres.length > 0) {
      const decadeStart = releaseYear ? Math.floor(releaseYear / 10) * 10 : null;
      for (const genre of genres) {
        if (decadeStart) {
          const artists = await searchArtistsByTrackSearch(genre, accessToken, [decadeStart, decadeStart + 9]);
          collect(artists.map(a => a.name));
        }
        const artists = await searchArtistsByTrackSearch(genre, accessToken);
        collect(artists.map(a => a.name));
        if (pool.length >= 10) break;
      }
    }
    if (pool.length >= 3) {
      const result = shuffle(pool).slice(0, 3);
      console.log('[generateDecoys] Step 1 (genre):', result);
      return result;
    }
  } catch (err: any) {
    console.error('[generateDecoys] Step 1 (genre) failed:', err.message);
  }

  // ── Step 2: Artist-name track search — harvest featured/collab artists ───
  try {
    const q = encodeURIComponent(realArtistName.split(', ')[0]);
    const data: any = await spotifyFetch(
      `/search?q=${q}&type=track&limit=50&market=US`,
      accessToken,
    );
    for (const track of (data.tracks?.items ?? [])) {
      collect((track.artists ?? []).map((a: any) => a.name));
    }
    if (pool.length >= 3) {
      const result = shuffle(pool).slice(0, 3);
      console.log('[generateDecoys] Step 2 (artist name search):', result);
      return result;
    }
  } catch (err: any) {
    console.error('[generateDecoys] Step 2 (artist name search) failed:', err.message);
  }

  // ── Step 3: Random word searches — same as /spotify/random, guaranteed ───
  const WORDS = shuffle([
    'love', 'baby', 'night', 'heart', 'time', 'dance', 'fire', 'dream',
    'life', 'world', 'rain', 'sun', 'blue', 'home', 'star', 'soul',
  ]);
  try {
    for (const word of WORDS.slice(0, 6)) {
      const offset = Math.floor(Math.random() * 20);
      const data: any = await spotifyFetch(
        `/search?q=${encodeURIComponent(word)}&type=track&limit=20&offset=${offset}&market=US`,
        accessToken,
      );
      for (const track of (data.tracks?.items ?? [])) {
        collect((track.artists ?? []).map((a: any) => a.name));
      }
      if (pool.length >= 3) break;
    }
  } catch (err: any) {
    console.error('[generateDecoys] Step 3 (random words) failed:', err.message);
  }

  const result = shuffle(pool).slice(0, 3);
  console.log(`[generateDecoys] returning ${result.length} decoys:`, result);
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
