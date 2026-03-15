let player: any = null;
let deviceId: string | null = null;

export function initSpotifyPlayer(accessToken: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (player && deviceId) {
      resolve(deviceId);
      return;
    }

    // Load SDK script if not already loaded
    if (!(window as any).Spotify) {
      const script = document.createElement('script');
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      document.body.appendChild(script);
    }

    (window as any).onSpotifyWebPlaybackSDKReady = () => {
      player = new (window as any).Spotify.Player({
        name: 'Que Preview',
        getOAuthToken: (cb: (token: string) => void) => cb(accessToken),
        volume: 0.8,
      });

      player.addListener('ready', ({ device_id }: { device_id: string }) => {
        deviceId = device_id;
        resolve(device_id);
      });

      player.addListener('initialization_error', ({ message }: { message: string }) => {
        reject(new Error(message));
      });

      player.addListener('authentication_error', ({ message }: { message: string }) => {
        reject(new Error(message));
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

export async function playTrack(spotifyUri: string, accessToken: string, positionMs = 0) {
  if (!deviceId) {
    throw new Error('Player not initialized');
  }

  await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
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
}

export async function pauseTrack() {
  if (player) {
    await player.pause();
  }
}

export function destroyPlayer() {
  if (player) {
    player.disconnect();
    player = null;
    deviceId = null;
  }
}
