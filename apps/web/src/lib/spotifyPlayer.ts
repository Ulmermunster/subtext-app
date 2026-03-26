let player: any = null;
let deviceId: string | null = null;
let currentToken: string | null = null;

function isMobile(): boolean {
  return /Android|iPhone|iPad|iPod|Mobile|webOS/i.test(navigator.userAgent);
}

export { isMobile };

export function initSpotifyPlayer(accessToken: string): Promise<string> {
  currentToken = accessToken;

  return new Promise((resolve, reject) => {
    // Spotify Web Playback SDK does NOT work on mobile browsers
    if (isMobile()) {
      reject(new Error('MOBILE_NOT_SUPPORTED'));
      return;
    }

    if (player && deviceId) {
      resolve(deviceId);
      return;
    }

    const timeout = setTimeout(() => {
      reject(new Error('SDK init timed out'));
    }, 15000);

    // Load SDK script if not already loaded
    if (!(window as any).Spotify) {
      const script = document.createElement('script');
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      document.body.appendChild(script);
    }

    (window as any).onSpotifyWebPlaybackSDKReady = () => {
      player = new (window as any).Spotify.Player({
        name: 'Que Preview',
        getOAuthToken: (cb: (token: string) => void) => cb(currentToken!),
        volume: 0.8,
      });

      player.addListener('ready', ({ device_id }: { device_id: string }) => {
        clearTimeout(timeout);
        deviceId = device_id;
        resolve(device_id);
      });

      player.addListener('initialization_error', ({ message }: { message: string }) => {
        clearTimeout(timeout);
        reject(new Error(`Init error: ${message}`));
      });

      player.addListener('authentication_error', ({ message }: { message: string }) => {
        clearTimeout(timeout);
        reject(new Error(`Auth error: ${message}`));
      });

      player.addListener('account_error', ({ message }: { message: string }) => {
        clearTimeout(timeout);
        reject(new Error(`Account error (Premium required): ${message}`));
      });

      player.addListener('playback_error', ({ message }: { message: string }) => {
        console.warn('Spotify playback error:', message);
      });

      player.addListener('not_ready', () => {
        console.log('Spotify player not ready');
      });

      player.connect();
    };

    // If SDK already loaded, trigger manually
    if ((window as any).Spotify) {
      (window as any).onSpotifyWebPlaybackSDKReady();
    }
  });
}

export async function playTrack(spotifyUri: string, accessToken: string, positionMs = 0): Promise<void> {
  if (!deviceId) {
    throw new Error('Player not initialized');
  }
  currentToken = accessToken;

  const res = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
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
    const body = await res.text().catch(() => '');
    if (res.status === 403) {
      throw new Error('PREMIUM_REQUIRED');
    }
    if (res.status === 404) {
      // Device gone — try reconnecting once
      deviceId = null;
      if (player) {
        try { player.disconnect(); } catch {}
        try { await player.connect(); } catch {}
        // Wait for ready event
        await new Promise<void>((resolve, reject) => {
          const t = setTimeout(() => reject(new Error('Reconnect timed out')), 8000);
          player.addListener('ready', ({ device_id }: { device_id: string }) => {
            clearTimeout(t);
            deviceId = device_id;
            resolve();
          });
        });
        // Retry play once
        const retry = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ uris: [spotifyUri], position_ms: positionMs }),
        });
        if (!retry.ok) throw new Error(`Play failed after reconnect: ${retry.status}`);
        return;
      }
      throw new Error('DEVICE_LOST');
    }
    throw new Error(`Play failed: ${res.status} ${body}`);
  }
}

export async function pauseTrack() {
  if (player) {
    try { await player.pause(); } catch {}
  }
}

export function destroyPlayer() {
  if (player) {
    try { player.disconnect(); } catch {}
    player = null;
    deviceId = null;
    currentToken = null;
  }
}
