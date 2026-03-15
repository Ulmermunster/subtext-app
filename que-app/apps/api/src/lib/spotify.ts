const SPOTIFY_API = 'https://api.spotify.com/v1';
const SPOTIFY_ACCOUNTS = 'https://accounts.spotify.com';

export async function spotifyFetch(path: string, accessToken: string, options?: RequestInit) {
  const res = await fetch(`${SPOTIFY_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
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
  return spotifyFetch(
    `/search?q=${encodeURIComponent(query)}&type=track,artist&limit=${limit}`,
    accessToken
  );
}

export async function getTrack(trackId: string, accessToken: string) {
  return spotifyFetch(`/tracks/${trackId}`, accessToken);
}

export async function getArtistAlbums(artistId: string, accessToken: string) {
  const albums: any[] = [];
  let url: string | null = `/artists/${artistId}/albums?include_groups=album,single&limit=50`;

  while (url) {
    const data: any = await spotifyFetch(url, accessToken);
    albums.push(...data.items);
    url = data.next ? data.next.replace(SPOTIFY_API, '') : null;
  }

  // Fetch tracks for each album
  const albumsWithTracks = await Promise.all(
    albums.map(async (album) => {
      const tracksData: any = await spotifyFetch(`/albums/${album.id}/tracks?limit=50`, accessToken);
      return {
        id: album.id,
        name: album.name,
        releaseDate: album.release_date,
        image: album.images?.[0]?.url || null,
        tracks: tracksData.items.map((t: any) => ({
          id: t.id,
          title: t.name,
          artist: t.artists.map((a: any) => a.name).join(', '),
          artistId: t.artists[0]?.id || '',
          albumName: album.name,
          albumArt: album.images?.[0]?.url || '',
          duration: t.duration_ms,
          previewUrl: t.preview_url || null,
          spotifyId: t.id,
          hasPreview: !!t.preview_url,
        })),
      };
    })
  );

  return albumsWithTracks;
}
