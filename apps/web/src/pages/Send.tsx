import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SearchInput from '../components/SearchInput';
import TrackResult from '../components/TrackResult';
import ArtistResult from '../components/ArtistResult';
import { api } from '../lib/api';
import { hapticTap, hapticReveal } from '../lib/haptics';
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

  // Progress ring math (circumference = 2 * PI * 46 ≈ 289)
  const circumference = 289;
  const strokeDashoffset = circumference * (1 - discoveryProgress);

  // ════════════════════════════════════════════
  // ── Discovery Mode UI (Crystal Cube Player) ──
  // ════════════════════════════════════════════
  if (discoveryMode) {
    return (
      <div className="bg-surface mesh-gradient min-h-screen font-body text-on-surface flex flex-col">
        {/* ── Top App Bar ── */}
        <header className="fixed top-0 w-full z-50 bg-black/40 backdrop-blur-3xl border-b border-white/5">
          <div className="flex justify-between items-center px-6 h-16 w-full">
            <button
              onClick={exitDiscovery}
              className="flex items-center gap-2 scale-95 active:scale-90 transition-transform duration-200 cursor-pointer"
            >
              <span className="material-symbols-outlined text-primary">arrow_back</span>
            </button>
            <h1 className="text-2xl font-black text-on-surface italic tracking-tight font-headline">
              Tasting Room<span className="text-primary">.</span>
            </h1>
            <div className="w-8" />
          </div>
        </header>

        {/* ── Main Crystal Cube Content ── */}
        <main className="flex-grow pt-24 pb-32 px-6 flex flex-col items-center justify-center max-w-lg mx-auto w-full">

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

          {/* Track loaded — Crystal Cube Player */}
          {discoveryTrack && !discoveryError && (
            <>
              <div className="relative w-full aspect-square flex items-center justify-center">
                {/* Atmospheric pulse background */}
                <div
                  className={`absolute inset-0 rounded-full blur-[80px] ${
                    discoveryRevealed
                      ? 'bg-gradient-to-tr from-primary/20 via-accent-yellow/20 to-secondary/20 opacity-60 pulse-completed'
                      : 'bg-gradient-to-tr from-primary/10 via-accent-yellow/10 to-secondary/10 opacity-40'
                  }`}
                />

                {/* Circular neon progress ring */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 scale-110">
                  <svg className="w-[320px] h-[320px] neon-glow" viewBox="0 0 100 100">
                    <circle
                      className="text-white/10 stroke-current"
                      cx="50" cy="50" r="46"
                      fill="transparent" strokeWidth="1.5"
                    />
                    <circle
                      className="text-[#00FFFF] stroke-current progress-ring"
                      cx="50" cy="50" r="46"
                      fill="transparent"
                      strokeWidth="2"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                {/* ── The Glass Cube ── */}
                <div
                  className="glass-cube relative w-64 h-64 flex items-center justify-center z-10"
                  style={{
                    transform: discoveryPlaying ? `scale(${scale})` : undefined,
                    transition: 'transform 80ms ease-out',
                  }}
                >
                  {/* Inner nebula morph */}
                  <div className="absolute inset-4 rounded-3xl overflow-hidden pointer-events-none">
                    <div className="nebula-morph w-full h-full opacity-60" />
                  </div>

                  {/* Album art layer (blurred when unrevealed) */}
                  {discoveryTrack.albumArt && (
                    <img
                      src={discoveryTrack.albumArt}
                      alt=""
                      className={`absolute inset-4 w-[calc(100%-2rem)] h-[calc(100%-2rem)] rounded-3xl object-cover z-[1] transition-all duration-700 ${
                        discoveryRevealed
                          ? 'opacity-90 blur-0 brightness-100'
                          : 'opacity-30 blur-xl brightness-75'
                      }`}
                    />
                  )}

                  {/* Cube body (frosted glass) */}
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-xl rounded-[2.5rem] border-[3px] border-white/40 shadow-[inset_0px_0px_30px_rgba(255,255,255,0.4),0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20" />
                  </div>

                  {/* Cube center controls */}
                  <div className="relative z-30 flex flex-col items-center gap-6">
                    {!discoveryRevealed && (
                      <span
                        className="text-5xl drop-shadow-lg"
                        style={{
                          transform: discoveryPlaying ? `scale(${scale})` : undefined,
                          transition: 'transform 80ms ease-out',
                        }}
                      >
                        🎵
                      </span>
                    )}
                    <div className="text-center px-4 py-1.5 rounded-full bg-white/5 backdrop-blur-sm border border-white/10">
                      <p className="font-headline font-extrabold text-white tracking-[0.2em] text-[10px] uppercase drop-shadow-sm">
                        {discoveryRevealed
                          ? 'TRACK REVEALED'
                          : discoveryPlaying
                          ? `${formatTime(30 - discoveryProgress * 30)} REMAINING`
                          : 'READY'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Below the cube: action area ── */}
              {!discoveryRevealed ? (
                <div className="mt-12 flex flex-col items-center gap-4 w-full">
                  {/* Vibe / Nope buttons */}
                  <div className="flex gap-6 mt-4">
                    <button
                      onPointerDown={hapticTap}
                      onClick={handleQueIt}
                      className="px-10 py-3 rounded-full bg-white/10 backdrop-blur-md border vibe-glow transition-all duration-300 active:scale-95"
                    >
                      <span className="font-headline font-black italic tracking-widest text-sm text-[#00CCCC] drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">
                        QUE IT
                      </span>
                    </button>
                    <button
                      onPointerDown={hapticReveal}
                      onClick={handleReveal}
                      className="px-10 py-3 rounded-full bg-white/10 backdrop-blur-md border nope-glow transition-all duration-300 active:scale-95"
                    >
                      <span className="font-headline font-black italic tracking-widest text-sm text-primary drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]">
                        REVEAL
                      </span>
                    </button>
                  </div>

                  {/* Hint text */}
                  {discoveryPlaying && (
                    <p className="text-muted text-center text-sm px-6 italic opacity-80 mt-4">
                      Listen closely... the identity reveals itself when you choose.
                    </p>
                  )}

                  {/* Progress info */}
                  <div className="w-full max-w-xs mt-2">
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#00FFFF] to-primary rounded-full transition-all duration-300"
                        style={{ width: `${discoveryProgress * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1.5">
                      <span className="text-[10px] text-muted">{formatTime(discoveryProgress * 30)}</span>
                      <span className="text-[10px] text-muted">{formatTime(30 - discoveryProgress * 30)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* ── Revealed State ── */
                <div className="mt-8 flex flex-col items-center gap-5 w-full">
                  {/* Revealed track identity */}
                  <div className="text-center">
                    <h1 className="font-headline font-black italic text-3xl text-primary tracking-tighter leading-tight uppercase">
                      {discoveryTrack.title}
                    </h1>
                    <p className="font-body font-medium text-muted text-base mt-2">
                      by <span className="font-bold text-white uppercase tracking-widest">{discoveryTrack.artist}</span>
                    </p>
                    {discoveryTrack.albumName && (
                      <p className="text-xs text-muted/70 mt-1">{discoveryTrack.albumName}</p>
                    )}
                  </div>

                  {/* Vibe or Nah */}
                  <h2 className="font-headline font-light italic text-primary text-xl tracking-[0.2em] uppercase">VIBE OR NAH?</h2>
                  <div className="flex gap-4 w-full max-w-xs">
                    <button
                      onPointerDown={hapticTap}
                      onClick={() => setDiscoveryVibe('VIBE')}
                      className={`flex-1 h-14 rounded-full bg-white/20 backdrop-blur-lg border flex items-center justify-center gap-2 transition-all active:scale-95 ${
                        discoveryVibe === 'VIBE' ? 'vibe-glow ring-2 ring-cyan-400/40' : 'border-white/30'
                      }`}
                    >
                      <span className="text-[#00CCCC]">❤️</span>
                      <span className="font-headline font-bold text-[#00CCCC] tracking-widest text-sm uppercase">VIBE</span>
                    </button>
                    <button
                      onPointerDown={hapticTap}
                      onClick={() => setDiscoveryVibe('NOPE')}
                      className={`flex-1 h-14 rounded-full bg-white/20 backdrop-blur-lg border flex items-center justify-center gap-2 transition-all active:scale-95 ${
                        discoveryVibe === 'NOPE' ? 'nope-glow ring-2 ring-rose-400/40' : 'border-white/30'
                      }`}
                    >
                      <span className="text-[#FF4D4D]">✕</span>
                      <span className="font-headline font-bold text-[#FF4D4D] tracking-widest text-sm uppercase">NOPE</span>
                    </button>
                  </div>

                  {/* Spotify link */}
                  <a
                    href={`https://open.spotify.com/track/${discoveryTrack.spotifyId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-spotify w-full max-w-xs flex items-center justify-center gap-2 min-h-[48px] no-underline"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
                    Open in Spotify
                  </a>

                  {/* Roll Again */}
                  <button
                    onPointerDown={hapticTap}
                    onClick={handleRollDice}
                    className="text-xs font-bold text-muted uppercase tracking-wider py-3 min-h-[44px] active:scale-95 transition-transform"
                  >
                    Roll Again 🎲
                  </button>
                </div>
              )}
            </>
          )}
        </main>

        {/* ── Bottom Nav Bar ── */}
        <nav className="fixed bottom-0 w-full z-50 bg-black/80 backdrop-blur-3xl rounded-t-[3rem] border-t border-white/5">
          <div className="flex justify-around items-center px-12 py-8">
            <button
              onClick={exitDiscovery}
              className="flex flex-col items-center justify-center text-white rounded-full px-8 py-3 shadow-xl cursor-pointer active:scale-[0.96] transition-all duration-300 ease-out tropical-gradient shadow-pink-500/20"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
              <span className="font-label text-[11px] uppercase tracking-[0.15em] mt-1 font-extrabold">Send</span>
            </button>
            <button
              onClick={() => { exitDiscovery(); navigate('/queue'); }}
              className="flex flex-col items-center justify-center hover:scale-105 transition-transform cursor-pointer active:scale-[0.96] duration-300 ease-out text-white"
            >
              <span className="material-symbols-outlined scale-110">library_music</span>
              <span className="font-label text-[11px] uppercase tracking-[0.15em] mt-1 font-extrabold">Collection</span>
            </button>
          </div>
        </nav>
      </div>
    );
  }

  // ════════════════════════════════════════════
  // ── Unified Home / Search Screen ──
  // ════════════════════════════════════════════
  const hasResults = searched && (tracks.length > 0 || artists.length > 0);

  return (
    <div className="bg-surface font-body text-on-surface mesh-gradient min-h-screen flex flex-col">
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
      <nav className="fixed bottom-0 w-full z-50 bg-black/80 backdrop-blur-3xl rounded-t-[3rem] border-t border-white/5">
        <div className="flex justify-around items-center px-12 py-8">
          <button
            className="flex flex-col items-center justify-center text-white rounded-full px-8 py-3 shadow-xl cursor-pointer active:scale-[0.96] transition-all duration-300 ease-out tropical-gradient shadow-pink-500/20"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
            <span className="font-label text-[11px] uppercase tracking-[0.15em] mt-1 font-extrabold">Send</span>
          </button>
          <button
            onClick={() => navigate('/queue')}
            className="flex flex-col items-center justify-center hover:scale-105 transition-transform cursor-pointer active:scale-[0.96] duration-300 ease-out text-white"
          >
            <span className="material-symbols-outlined scale-110">library_music</span>
            <span className="font-label text-[11px] uppercase tracking-[0.15em] mt-1 font-extrabold">Collection</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
