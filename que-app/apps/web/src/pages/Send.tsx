import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchInput from '../components/SearchInput';
import TrackResult from '../components/TrackResult';
import ArtistResult from '../components/ArtistResult';
import { api } from '../lib/api';
import { hapticPop } from '../lib/haptics';
import { useBassPulse } from '../lib/useBassPulse';

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function Send() {
  const navigate = useNavigate();
  const [searchLoading, setSearchLoading] = useState(false);
  const [tracks, setTracks] = useState<any[]>([]);
  const [artists, setArtists] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Discovery mode state
  const [discoveryMode, setDiscoveryMode] = useState(false);
  const [discoveryTrack, setDiscoveryTrack] = useState<any>(null);
  const [discoveryLoading, setDiscoveryLoading] = useState(false);
  const [discoveryPlaying, setDiscoveryPlaying] = useState(false);
  const [discoveryRevealed, setDiscoveryRevealed] = useState(false);
  const [discoveryProgress, setDiscoveryProgress] = useState(0);
  const [discoveryError, setDiscoveryError] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<number | null>(null);

  // Bass pulse visualizer
  const { scale, connectAudio, disconnect: disconnectPulse } = useBassPulse();

  const handleSearch = useCallback(async (query: string) => {
    setSearchLoading(true);
    setSearchError('');
    try {
      const data = await api.search(query);
      setTracks(data.tracks);
      setArtists(data.artists);
      setSearched(true);
    } catch {
      setSearchError('Search failed. Try again.');
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const handleTrackSelect = useCallback((track: any) => {
    navigate('/send/clip', { state: { track } });
  }, [navigate]);

  const handleArtistSelect = useCallback((artist: any) => {
    navigate(`/send/artist/${artist.id}`, { state: { artist } });
  }, [navigate]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (progressRef.current) {
        clearInterval(progressRef.current);
      }
      disconnectPulse();
    };
  }, []);

  const handleRollDice = async () => {
    setDiscoveryMode(true);
    setDiscoveryLoading(true);
    setDiscoveryTrack(null);
    setDiscoveryRevealed(false);
    setDiscoveryPlaying(false);
    setDiscoveryProgress(0);
    setDiscoveryError('');

    // Stop any previous audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (progressRef.current) {
      clearInterval(progressRef.current);
    }
    disconnectPulse();

    try {
      const track = await api.getRandomTrack();
      setDiscoveryTrack(track);
      setDiscoveryLoading(false);

      // Auto-play preview
      const audio = new Audio(track.previewUrl);
      audio.crossOrigin = 'anonymous';
      audioRef.current = audio;
      const start = Date.now();
      const duration = 30;

      progressRef.current = window.setInterval(() => {
        const elapsed = (Date.now() - start) / 1000;
        setDiscoveryProgress(Math.min(elapsed / duration, 1));
        if (elapsed >= duration) {
          if (progressRef.current) clearInterval(progressRef.current);
          setDiscoveryPlaying(false);
          disconnectPulse();
        }
      }, 250);

      audio.play()
        .then(() => {
          setDiscoveryPlaying(true);
          connectAudio(audio);
        })
        .catch(() => setDiscoveryError('Could not play audio'));

      audio.addEventListener('ended', () => {
        setDiscoveryPlaying(false);
        if (progressRef.current) clearInterval(progressRef.current);
        setDiscoveryProgress(1);
        disconnectPulse();
      });
    } catch {
      setDiscoveryError('No track found. Roll again!');
      setDiscoveryLoading(false);
    }
  };

  const handleQueIt = () => {
    if (!discoveryTrack) return;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (progressRef.current) clearInterval(progressRef.current);
    disconnectPulse();
    navigate('/send/clip', { state: { track: discoveryTrack } });
  };

  const handleReveal = () => {
    setDiscoveryRevealed(true);
  };

  const exitDiscovery = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (progressRef.current) clearInterval(progressRef.current);
    disconnectPulse();
    setDiscoveryMode(false);
    setDiscoveryTrack(null);
    setDiscoveryRevealed(false);
    setDiscoveryPlaying(false);
    setDiscoveryProgress(0);
    setDiscoveryError('');
  };

  // ---- Discovery Mode UI ----
  if (discoveryMode) {
    return (
      <div className="w-full max-w-md mx-auto px-5 flex flex-col items-center" style={{ minHeight: '100dvh', paddingTop: 'max(1rem, env(safe-area-inset-top))', paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
        {/* Header */}
        <div className="w-full flex items-center justify-between py-2">
          <button onClick={exitDiscovery} className="text-muted text-lg w-10 h-10 flex items-center justify-center">←</button>
          <h2 className="text-lg font-extrabold text-ink tracking-tight">
            Tasting Room<span className="text-gold">.</span>
          </h2>
          <div className="w-10" />
        </div>

        {discoveryLoading && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <div className="spinner" />
            <p className="text-sm text-muted font-medium">Rolling the dice...</p>
          </div>
        )}

        {discoveryError && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <span className="text-4xl">🎲</span>
            <p className="text-sm text-coral font-medium">{discoveryError}</p>
            <button onClick={handleRollDice} className="btn-primary text-sm px-6 py-3 mt-2">
              Roll Again
            </button>
          </div>
        )}

        {discoveryTrack && !discoveryError && (
          <div className="flex-1 flex flex-col items-center justify-center w-full gap-5">
            {/* Mystery album art — blurred if not revealed, pulsing with bass */}
            <div className="relative">
              {/* Bass-reactive glow ring */}
              {discoveryPlaying && (
                <div
                  className="absolute inset-[-8px] rounded-[28px] bg-gold/20 blur-md"
                  style={{
                    transform: `scale(${scale})`,
                    transition: 'transform 80ms ease-out',
                  }}
                />
              )}
              <img
                src={discoveryTrack.albumArt}
                alt=""
                className={`w-48 h-48 rounded-3xl object-cover shadow-card-hover border-4 border-white relative z-10 ${
                  discoveryRevealed ? '' : 'blur-xl brightness-75'
                }`}
                style={{
                  transform: discoveryPlaying ? `scale(${scale})` : undefined,
                  transition: 'transform 80ms ease-out, filter 0.5s ease',
                }}
              />
              {!discoveryRevealed && (
                <div className="absolute inset-0 flex items-center justify-center z-20">
                  <span
                    className="text-5xl"
                    style={{
                      transform: discoveryPlaying ? `scale(${scale})` : undefined,
                      transition: 'transform 80ms ease-out',
                    }}
                  >🎵</span>
                </div>
              )}
            </div>

            {/* Track info */}
            <div className="text-center">
              <div className="text-xl font-extrabold text-ink">
                {discoveryRevealed ? discoveryTrack.title : '???'}
              </div>
              <div className="text-sm text-muted font-medium mt-1">
                {discoveryRevealed
                  ? `${discoveryTrack.artist} · ${discoveryTrack.albumName}`
                  : '??? · ???'}
              </div>
            </div>

            {/* Progress scrubber */}
            <div className="w-full max-w-xs">
              <div className="w-full h-1 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-gold to-gold-light rounded-full transition-all duration-300"
                  style={{ width: `${discoveryProgress * 100}%` }}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[10px] text-muted">{formatTime(discoveryProgress * 30)}</span>
                <span className="text-[10px] text-muted">{formatTime(30 - discoveryProgress * 30)}</span>
              </div>
            </div>

            {/* Playing indicator */}
            {discoveryPlaying && !discoveryRevealed && (
              <p className="text-xs text-muted font-medium">artist reveals after you choose</p>
            )}

            {/* Action buttons — the fork in the road */}
            {!discoveryRevealed ? (
              <div className="flex gap-3 w-full max-w-xs">
                <button
                  onClick={() => { hapticPop(); handleQueIt(); }}
                  className="btn-primary flex-1 text-sm py-3 min-h-[48px]"
                >
                  Que it 📨
                </button>
                <button
                  onClick={() => { hapticPop(); handleReveal(); }}
                  className="flex-1 card p-3 font-bold text-ink text-sm flex items-center justify-center hover:shadow-card-hover transition-all min-h-[48px] active:scale-[0.985]"
                >
                  Reveal 👀
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 w-full max-w-xs">
                <a
                  href={`https://open.spotify.com/track/${discoveryTrack.spotifyId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-spotify w-full flex items-center justify-center gap-2 min-h-[48px] no-underline"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
                  Open in Spotify
                </a>
                <button
                  onClick={() => { hapticPop(); handleQueIt(); }}
                  className="btn-primary w-full text-sm py-3 min-h-[48px]"
                >
                  Que it to a friend 📨
                </button>
                <button
                  onClick={() => { hapticPop(); handleRollDice(); }}
                  className="text-xs font-bold text-muted uppercase tracking-wider py-3 min-h-[44px] active:scale-95 transition-transform"
                >
                  Roll Again 🎲
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ---- Normal Search UI ----
  return (
    <div className="w-full max-w-md mx-auto px-5 flex flex-col" style={{ minHeight: '100dvh', paddingTop: 'max(1rem, env(safe-area-inset-top))', paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
      {/* Back + close button */}
      <div className="flex items-center justify-between py-2">
        <button onClick={() => navigate('/')} className="text-muted text-lg w-10 h-10 flex items-center justify-center">←</button>
        <button
          onClick={() => navigate('/')}
          className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center text-muted text-sm active:scale-95 transition-transform"
        >
          ✕
        </button>
      </div>

      <div className="mt-2">
        <SearchInput onSearch={handleSearch} isLoading={searchLoading} />
      </div>

      {/* Roll the Dice button */}
      <button
        onClick={() => { hapticPop(); handleRollDice(); }}
        className="mt-3 py-2.5 text-sm font-semibold text-gold border border-gold/30 rounded-full active:scale-[0.985] transition-all hover:bg-gold/5"
      >
        Roll the Dice 🎲
      </button>

      {searchLoading && (
        <p className="text-center text-gold text-sm font-medium mt-4">searching...</p>
      )}

      {/* Empty state */}
      {!searchLoading && !searched && (
        <div className="flex flex-col items-center justify-center flex-1">
          <p className="text-sm text-muted">Search for a song or artist</p>
        </div>
      )}

      {searchError && (
        <p className="text-center text-coral text-sm mt-4">{searchError}</p>
      )}

      {!searchLoading && searched && tracks.length === 0 && artists.length === 0 && !searchError && (
        <div className="card p-6 text-center space-y-2 mt-4">
          <p className="text-muted text-sm">No results found</p>
          <p className="text-xs text-muted">
            Try a different search term.
          </p>
        </div>
      )}

      {/* Track results */}
      <div className="flex-1 overflow-y-auto mt-4 -mx-1 px-1" style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
        {tracks.length > 0 && (
          <div className="space-y-0">
            {tracks.map((track) => (
              <TrackResult
                key={track.id}
                track={track}
                onSelect={() => { hapticPop(); handleTrackSelect(track); }}
              />
            ))}
          </div>
        )}

        {/* Artist results */}
        {artists.length > 0 && (
          <div className="space-y-0">
            <div className="px-1 py-2 text-xs font-semibold text-muted uppercase tracking-wider">
              Artists
            </div>
            {artists.map((artist) => (
              <ArtistResult
                key={artist.id}
                artist={artist}
                onSelect={() => handleArtistSelect(artist)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
