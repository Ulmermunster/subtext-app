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
  console.log('[getRelatedArtists] Fetching for artistId:', artistId, 'tokenLen:', accessToken?.length);
  try {
    const data: any = await spotifyFetch(`/artists/${artistId}/related-artists`, accessToken);
    const artists = data.artists || [];
    console.log('[getRelatedArtists] Spotify returned', artists.length, 'related artists');
    if (artists.length === 0) {
      console.log('[getRelatedArtists] Full response keys:', Object.keys(data));
    }
    // Sort by popularity descending, take top 10 most recognizable
    const sorted = artists
      .sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, 10);
    return sorted.map((a: any) => a.name);
  } catch (err: any) {
    console.error('[getRelatedArtists] Spotify API failed:', err.status || 'unknown status', err.message);
    throw err;
  }
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
