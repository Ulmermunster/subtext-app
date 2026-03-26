// Spotify Connect API — controls the Spotify app on the user's device
// Works on mobile (unlike the Web Playback SDK which is desktop-only)

const SPOTIFY_API = 'https://api.spotify.com/v1';

interface SpotifyDevice {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
}

export async function getDevices(accessToken: string): Promise<SpotifyDevice[]> {
  const res = await fetch(`${SPOTIFY_API}/me/player/devices`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.devices || [];
}

export async function findPlayableDevice(accessToken: string): Promise<string | null> {
  const devices = await getDevices(accessToken);
  // Prefer the active device, then any smartphone, then any device
  const active = devices.find(d => d.is_active);
  if (active) return active.id;
  const phone = devices.find(d => d.type === 'Smartphone');
  if (phone) return phone.id;
  return devices[0]?.id || null;
}

export async function connectPlay(
  accessToken: string,
  spotifyUri: string,
  positionMs: number,
  deviceId: string
): Promise<void> {
  const res = await fetch(`${SPOTIFY_API}/me/player/play?device_id=${deviceId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      uris: [spotifyUri],
      position_ms: positionMs,
    }),
  });
  if (!res.ok) {
    if (res.status === 403) throw new Error('PREMIUM_REQUIRED');
    if (res.status === 404) throw new Error('NO_DEVICE');
    throw new Error(`Connect play failed: ${res.status}`);
  }
}

export async function connectPause(accessToken: string, deviceId: string): Promise<void> {
  await fetch(`${SPOTIFY_API}/me/player/pause?device_id=${deviceId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${accessToken}` },
  }).catch(() => {});
}
