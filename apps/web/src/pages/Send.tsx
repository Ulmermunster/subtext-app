import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SearchInput from '../components/SearchInput';
import TrackResult from '../components/TrackResult';
import ArtistResult from '../components/ArtistResult';
import BottomNav from '../components/BottomNav';
import OrbVisualizer from '../components/OrbVisualizer';
import { api } from '../lib/api';
import { hapticTap } from '../lib/haptics';
import { useBassPulse } from '../lib/useBassPulse';

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function Send() {
  const navigate = useNavigate();
  const location = useLocation();
  const defaultGameMode = (location.state as any)?.defaultGameMode;
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
    navigate('/send/clip', { state: { track, defaultGameMode } });
  }, [navigate, defaultGameMode]);

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

  // Pause audio when tab/browser is hidden (Page Visibility API)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
        setDiscoveryPlaying(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const handleRollDice = async () => {
    if (discoveryLoading) return; // Prevent concurrent API calls on rapid clicks
    setDiscoveryMode(true);
    setDiscoveryLoading(true);
    setDiscoveryTrack(null);
    setDiscoveryRevealed(false);
    setDiscoveryPlaying(false);
    setDiscoveryProgress(0);
    setDiscoveryError('');
    setDiscoveryVibe(null);

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

      if (!track.previewUrl) {
        setDiscoveryError('No preview available. Roll again!');
        return;
      }

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
          setDiscoveryRevealed(true);
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
        setDiscoveryRevealed(true);
        disconnectPulse();
      }, { once: true });
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

  const [discoveryVibe, setDiscoveryVibe] = useState<'VIBE' | 'NOPE' | null>(null);

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

  // ════════════════════════════════════════════
  // ── Discovery Mode UI (Orb Visualizer Player) ──
  // ════════════════════════════════════════════
  if (discoveryMode) {
    return (
      <div className="h-[100dvh] w-full fixed inset-0 overflow-hidden flex flex-col bg-surface sugar-rush-mesh font-body text-on-surface">
        {/* ── Top App Bar — Centered QUE. wordmark ── */}
        <header className="shrink-0 bg-black/40 backdrop-blur-3xl border-b border-white/5 z-50">
          <div className="flex justify-between items-center px-6 h-14 w-full">
            <button
              onClick={exitDiscovery}
              className="flex items-center gap-2 scale-95 active:scale-90 transition-transform duration-200 cursor-pointer"
            >
              <span className="material-symbols-outlined text-primary">music_note</span>
            </button>
            <div className="text-2xl font-black italic text-on-surface tracking-tight font-headline">QUE.</div>
            <div className="w-8" />
          </div>
        </header>

        {/* ── Main Content Canvas — fills remaining space, no scroll ── */}
        <main className="flex-1 min-h-0 flex flex-col items-center justify-center relative px-6 py-4 overflow-hidden">

          {/* Loading state */}
          {discoveryLoading && (
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="spinner" />
              <p className="text-sm text-muted font-medium">Rolling the dice...</p>
            </div>
          )}

          {/* Error state */}
          {discoveryError && (
            <div className="flex flex-col items-center justify-center gap-4">
              <span className="material-symbols-outlined text-5xl text-primary">casino</span>
              <p className="text-sm text-error font-medium">{discoveryError}</p>
              <button
                onPointerDown={hapticTap}
                onClick={handleRollDice}
                className="tropical-gradient text-white px-8 py-3 rounded-full font-headline shadow-2xl shadow-pink-500/20 active:scale-95 transition-all duration-300 text-sm font-extrabold uppercase tracking-widest mt-2"
              >
                Roll Again
              </button>
            </div>
          )}

          {/* Track loaded — Vibe or Nah? Player */}
          {discoveryTrack && !discoveryError && (
            <div className="flex flex-col items-center w-full max-w-sm gap-4">
              {/* Editorial Header */}
              <div className="text-center shrink-0">
                <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter text-white mb-1 leading-none font-headline">
                  Vibe or Nah?
                </h1>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-white/40 font-label">The Blind Listen</p>
              </div>

              {/* Orb Visualizer — matches Discover, Guess, and Receiver */}
              <div className="flex-1 min-h-0 flex flex-col items-center justify-center w-full">
                <OrbVisualizer
                  playing={discoveryPlaying}
                  scale={scale}
                  albumArt={discoveryTrack.albumArt}
                  revealed={discoveryRevealed}
                  size="lg"
                />
              </div>

              {/* Track Details — below the cube */}
              <div className="text-center shrink-0">
                {discoveryRevealed ? (
                  <>
                    <h2 className="text-2xl font-black italic tracking-tighter text-primary uppercase font-headline">
                      {discoveryTrack.title}
                    </h2>
                    <p className="text-base font-bold text-white uppercase tracking-widest mt-1 font-headline">
                      by {discoveryTrack.artist}
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="text-2xl font-black italic tracking-tighter text-white/30 uppercase font-headline">
                      ???
                    </h2>
                    <p className="text-sm font-bold text-white/20 uppercase tracking-widest mt-1 font-headline">
                      {discoveryPlaying
                        ? `${formatTime(30 - discoveryProgress * 30)} remaining`
                        : 'Ready'}
                    </p>
                  </>
                )}
              </div>

              {/* ── Pre-Reveal: Vibe / Nope voting buttons ── */}
              {!discoveryRevealed && (
                <div className="shrink-0 flex flex-col items-center gap-3 w-full">
                  <div className="flex gap-5 w-full">
                    <button
                      onPointerDown={hapticTap}
                      onClick={() => { if (!discoveryVibe) setDiscoveryVibe('VIBE'); }}
                      disabled={!!discoveryVibe}
                      className={`vibe-pill-glass flex-1 py-4 rounded-full flex items-center justify-center gap-3 transition-all text-accent-yellow ${
                        discoveryVibe === 'VIBE'
                          ? 'ring-2 ring-yellow-400/50 shadow-[0_0_30px_rgba(250,204,21,0.3)] scale-[1.03]'
                          : discoveryVibe === 'NOPE'
                            ? 'opacity-30 pointer-events-none'
                            : 'active:scale-95'
                      }`}
                    >
                      <span className="material-symbols-outlined font-bold glow-text-yellow" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                      <span className="text-xs font-black uppercase tracking-widest glow-text-yellow">Vibe</span>
                    </button>
                    <button
                      onPointerDown={hapticTap}
                      onClick={() => { if (!discoveryVibe) { setDiscoveryVibe('NOPE'); handleReveal(); } }}
                      disabled={!!discoveryVibe}
                      className={`nope-pill-glass flex-1 py-4 rounded-full flex items-center justify-center gap-3 transition-all text-primary ${
                        discoveryVibe === 'NOPE'
                          ? 'ring-2 ring-rose-400/50 shadow-[0_0_30px_rgba(236,72,153,0.3)]'
                          : discoveryVibe === 'VIBE'
                            ? 'opacity-30 pointer-events-none'
                            : 'active:scale-95'
                      }`}
                    >
                      <span className="material-symbols-outlined font-bold glow-text-pink">close</span>
                      <span className="text-xs font-black uppercase tracking-widest glow-text-pink">Nope</span>
                    </button>
                  </div>
                  {/* Locked-in indicator when Vibe is selected, waiting for reveal */}
                  {discoveryVibe === 'VIBE' && (
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-yellow/70 animate-pulse">
                      Locked in — revealing when the beat drops
                    </p>
                  )}
                </div>
              )}

              {/* ── Post-Reveal: Universal action buttons ── */}
              {discoveryRevealed && (
                <div className="shrink-0 flex flex-col items-center gap-3 w-full">
                  {/* Open in Spotify — green pill */}
                  <a
                    href={`https://open.spotify.com/track/${discoveryTrack.spotifyId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-spotify w-full flex items-center justify-center gap-2 min-h-[44px] rounded-full no-underline text-sm"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
                    Open in Spotify
                  </a>

                  {/* Que this Song — tropical gradient primary CTA */}
                  <button
                    onPointerDown={hapticTap}
                    onClick={handleQueIt}
                    className="tropical-gradient text-white w-full min-h-[44px] rounded-full font-headline shadow-2xl shadow-pink-500/20 active:scale-95 transition-all duration-300 text-sm font-extrabold uppercase tracking-widest"
                  >
                    Que this Song
                  </button>

                  {/* Roll Again — muted text */}
                  <button
                    onPointerDown={hapticTap}
                    onClick={handleRollDice}
                    className="text-xs font-bold text-muted uppercase tracking-wider py-2 min-h-[36px] active:scale-95 transition-transform"
                  >
                    Roll Again
                  </button>
                </div>
              )}

              {/* Mystery Glow Indicator — shown while listening pre-reveal */}
              {!discoveryRevealed && discoveryPlaying && (
                <div className="shrink-0 flex flex-col items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-yellow shadow-[0_0_10px_#facc15] animate-pulse" />
                  <p className="text-[9px] font-black uppercase tracking-[0.4em] text-accent-yellow">Decrypting</p>
                </div>
              )}
            </div>
          )}
        </main>

        {/* ── Bottom Nav Bar ── */}
        <BottomNav active="send" />
      </div>
    );
  }

  // ════════════════════════════════════════════
  // ── Unified Home / Search Screen ──
  // ════════════════════════════════════════════
  const hasResults = searched && (tracks.length > 0 || artists.length > 0);

  return (
    <div className="h-[100dvh] w-full fixed inset-0 flex flex-col overflow-hidden bg-surface font-body text-on-surface mesh-gradient">
      {/* ── Top Header ── */}
      <header className="fixed top-0 w-full z-50 bg-black/40 backdrop-blur-3xl border-b border-white/5">
        <div className="flex justify-between items-center px-6 h-16 w-full">
          <div className="flex items-center gap-2 scale-95 active:scale-90 transition-transform duration-200 cursor-pointer">
            <span className="material-symbols-outlined text-primary">music_note</span>
          </div>
          <h1 className="text-2xl font-black text-on-surface italic tracking-tight font-headline">Que.</h1>
          <div className="w-8" />
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-grow pt-24 pb-32 px-6 flex flex-col items-center justify-center max-w-lg mx-auto w-full">

        {/* ── Search Bar ── */}
        <section className="w-full mb-8">
          <SearchInput onSearch={handleSearch} isLoading={searchLoading} />
        </section>

        {/* Search loading */}
        {searchLoading && (
          <p className="text-center text-primary text-sm font-medium mt-6">searching...</p>
        )}

        {/* Search error */}
        {searchError && (
          <p className="text-center text-error text-sm mt-4">{searchError}</p>
        )}

        {/* No results */}
        {!searchLoading && searched && !hasResults && !searchError && (
          <div className="glass-card p-6 text-center space-y-2 mt-6">
            <p className="text-muted text-sm">No results found</p>
            <p className="text-xs text-muted">Try a different search term.</p>
          </div>
        )}

        {/* ── Search Results ── */}
        {hasResults && (
          <div
            className="flex-1 overflow-y-auto w-full -mx-1 px-1"
            style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
          >
            {tracks.length > 0 && (
              <div className="space-y-0">
                {tracks.map((track) => (
                  <TrackResult
                    key={track.id}
                    track={track}
                    onSelect={() => handleTrackSelect(track)}
                  />
                ))}
              </div>
            )}
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
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* ── Empty State: Roll the Dice CTA ──       */}
        {/* ═══════════════════════════════════════════ */}
        {!searchLoading && !hasResults && !searchError && (
          <section className="flex flex-col items-center justify-center space-y-12 text-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-headline tracking-tight leading-tight font-bold">
                <span className="text-white">Not sure what to send?</span><br />
                <span className="text-white">Roll for a random vibe.</span>
              </h2>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-full -z-10" />
              <button
                onPointerDown={hapticTap}
                onClick={handleRollDice}
                className="tropical-gradient text-white px-12 py-5 rounded-full font-headline shadow-2xl shadow-pink-500/20 active:scale-95 transition-all duration-300 text-lg font-extrabold uppercase tracking-widest"
              >
                Roll the Dice
              </button>
            </div>
          </section>
        )}
      </main>

      {/* ── Bottom Nav Bar ── */}
      <BottomNav active="send" />
    </div>
  );
}
