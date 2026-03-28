const API_BASE = '';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { ...options?.headers as Record<string, string> };
  // Only set Content-Type for requests with a body (POST, PUT, PATCH)
  if (options?.body) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Request failed' }));
    throw Object.assign(new Error(body.error || body.message || `HTTP ${res.status}`), {
      status: res.status,
      body,
    });
  }

  return res.json();
}

export const api = {
  getMe: () => request<{ displayName: string; connected: boolean; accessToken: string }>('/auth/me'),
  search: (q: string) => request<{ tracks: any[]; artists: any[] }>(`/spotify/search?q=${encodeURIComponent(q)}`),
  getTrack: (id: string) => request<any>(`/spotify/track/${id}`),
  getArtistAlbums: (id: string) => request<any[]>(`/spotify/artist/${id}/albums`),
  getAlbumTracks: (id: string) => request<any>(`/spotify/album/${id}/tracks`),
  createVibe: (body: { trackId: string; mode: string; startSec?: number; senderDisplayName?: string }) =>
    request<{ vibeId: string; shareUrl: string }>('/vibes/create', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};
