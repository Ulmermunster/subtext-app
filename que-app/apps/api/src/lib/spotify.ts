const SPOTIFY_API = 'https://api.spotify.com/v1';
const SPOTIFY_ACCOUNTS = 'https://accounts.spotify.com';

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

export async function getRelatedArtists(artistId: string, accessToken: string): Promise<string[]> {
  if (!artistId) {
    console.error('[getRelatedArtists] artistId is empty/undefined!');
    return [];
  }
  console.log('[getRelatedArtists] Fetching for artistId:', artistId);
  const data: any = await spotifyFetch(`/artists/${artistId}/related-artists`, accessToken);
  const artists = data.artists || [];
  console.log('[getRelatedArtists] Spotify returned', artists.length, 'related artists');
  // Sort by popularity descending, take top 10 most recognizable
  const sorted = artists
    .sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0))
    .slice(0, 10);
  return sorted.map((a: any) => a.name);
}

export async function getArtist(artistId: string, accessToken: string): Promise<{ name: string; genres: string[] }> {
  const data: any = await spotifyFetch(`/artists/${artistId}`, accessToken);
  return { name: data.name, genres: data.genres || [] };
}

export async function searchArtistsByGenre(genre: string, accessToken: string, limit = 10): Promise<string[]> {
  const safeLimit = Math.min(limit, 10);
  const data: any = await spotifyFetch(
    `/search?q=${encodeURIComponent(`genre:"${genre}"`)}&type=artist&limit=${safeLimit}&market=US`,
    accessToken
  );
  return (data.artists?.items || []).map((a: any) => a.name);
}

export async function getArtistTopTracks(artistId: string, accessToken: string): Promise<Array<{ name: string; artists: string[] }>> {
  const data: any = await spotifyFetch(`/artists/${artistId}/top-tracks?market=US`, accessToken);
  return (data.tracks || []).map((t: any) => ({
    name: t.name,
    artists: (t.artists || []).map((a: any) => a.name),
  }));
}

/**
 * Multi-tier decoy generation cascade.
 * Guarantees 3 contextually relevant decoy artist names.
 *
 * Tier 1: Spotify Related Artists API
 * Tier 2: Genre-based artist search
 * Tier 3: Featured/collaborator artists from top tracks
 * Tier 4: Era-matched defaults based on release year
 */
export async function generateDecoys(
  artistId: string,
  realArtistName: string,
  releaseYear: number | null,
  accessToken: string
): Promise<string[]> {
  const realNames = new Set(realArtistName.split(', ').map(n => n.toLowerCase()));
  const isNotReal = (name: string) => !realNames.has(name.toLowerCase());

  function pickThree(pool: string[]): string[] | null {
    const filtered = pool.filter(isNotReal);
    // Dedupe
    const unique = [...new Set(filtered.map(n => n.trim()))];
    if (unique.length >= 3) {
      // Fisher-Yates shuffle
      for (let i = unique.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [unique[i], unique[j]] = [unique[j], unique[i]];
      }
      return unique.slice(0, 3);
    }
    return null;
  }

  // --- Tier 1: Related Artists ---
  try {
    const related = await getRelatedArtists(artistId, accessToken);
    const picked = pickThree(related);
    if (picked) {
      console.log('[generateDecoys] Tier 1 (related artists):', picked);
      return picked;
    }
    console.log('[generateDecoys] Tier 1 insufficient (' + related.length + ' results), trying Tier 2');
  } catch (err: any) {
    console.error('[generateDecoys] Tier 1 failed:', err.status || '', err.message);
  }

  // --- Tier 2: Genre Search ---
  try {
    const artist = await getArtist(artistId, accessToken);
    if (artist.genres.length > 0) {
      // Try first two genres for better coverage
      const allResults: string[] = [];
      for (const genre of artist.genres.slice(0, 2)) {
        const results = await searchArtistsByGenre(genre, accessToken, 10);
        allResults.push(...results);
      }
      const picked = pickThree(allResults);
      if (picked) {
        console.log('[generateDecoys] Tier 2 (genre search "' + artist.genres.slice(0, 2).join(', ') + '"):', picked);
        return picked;
      }
      console.log('[generateDecoys] Tier 2 insufficient, trying Tier 3');
    } else {
      console.log('[generateDecoys] Tier 2 skipped (no genres), trying Tier 3');
    }
  } catch (err: any) {
    console.error('[generateDecoys] Tier 2 failed:', err.status || '', err.message);
  }

  // --- Tier 3: Featured Artists from Top Tracks ---
  try {
    const topTracks = await getArtistTopTracks(artistId, accessToken);
    const featured: string[] = [];
    for (const track of topTracks) {
      for (const name of track.artists) {
        if (isNotReal(name)) featured.push(name);
      }
    }
    const picked = pickThree(featured);
    if (picked) {
      console.log('[generateDecoys] Tier 3 (featured artists):', picked);
      return picked;
    }
    console.log('[generateDecoys] Tier 3 insufficient (' + featured.length + ' unique), trying Tier 4');
  } catch (err: any) {
    console.error('[generateDecoys] Tier 3 failed:', err.status || '', err.message);
  }

  // --- Tier 4: Era-Matched Defaults ---
  const ERA_DEFAULTS: Record<string, string[]> = {
    '2020s': ['Olivia Rodrigo', 'Sabrina Carpenter', 'Chappell Roan', 'Gracie Abrams', 'Reneé Rapp',
              'Ice Spice', 'NewJeans', 'Tyla', 'Zach Bryan', 'Noah Kahan'],
    '2010s': ['Lorde', 'Halsey', 'Khalid', 'Cardi B', 'Lizzo',
              'Bazzi', 'Rex Orange County', 'Clairo', 'BROCKHAMPTON', 'Glass Animals'],
    '2000s': ['Amy Winehouse', 'Nelly Furtado', 'The Killers', 'Kings of Leon', 'Gnarls Barkley',
              'Fergie', 'Panic! At The Disco', 'Fall Out Boy', 'My Chemical Romance', 'Paramore'],
    '1990s': ['Alanis Morissette', 'No Doubt', 'Garbage', 'Third Eye Blind', 'Weezer',
              'Jewel', 'Blind Melon', 'Collective Soul', 'Counting Crows', 'Live'],
    'classic': ['Fleetwood Mac', 'Blondie', 'The Cure', 'Talking Heads', 'The Smiths',
                'Siouxsie and the Banshees', 'Echo & the Bunnymen', 'Cocteau Twins', 'Joy Division', 'New Order'],
  };
  const year = releaseYear || new Date().getFullYear();
  let eraKey: string;
  if (year >= 2020) eraKey = '2020s';
  else if (year >= 2010) eraKey = '2010s';
  else if (year >= 2000) eraKey = '2000s';
  else if (year >= 1990) eraKey = '1990s';
  else eraKey = 'classic';

  const eraPool = ERA_DEFAULTS[eraKey].filter(isNotReal);
  // Shuffle
  for (let i = eraPool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [eraPool[i], eraPool[j]] = [eraPool[j], eraPool[i]];
  }
  const picked = eraPool.slice(0, 3);
  console.log('[generateDecoys] Tier 4 (era "' + eraKey + '" defaults):', picked);
  return picked;
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
