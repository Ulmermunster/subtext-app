import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { hapticTap, hapticReveal } from '../lib/haptics';
import { useBassPulse } from '../lib/useBassPulse';
import OrbVisualizer from '../components/OrbVisualizer';

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function Discover() {
  const navigate = useNavigate();

  const [track, setTrack] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [vibe, setVibe] = useState<'VIBE' | 'NOPE' | null>(null);
  const [sessionCount, setSessionCount] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<number | null>(null);
  const { scale, connectAudio, disconnect: disconnectPulse } = useBassPulse();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      if (progressRef.current) clearInterval(progressRef.current);
      disconnectPulse();
    };
  }, []);

  // Pause when tab hidden
  useEffect(() => {
    const handler = () => {
      if (document.hidden && audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
        setPlaying(false);
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  const rollDice = async () => {
    setLoading(true);
    setTrack(null);
    setRevealed(false);
    setPlaying(false);
    setProgress(0);
    setError('');
    setVibe(null);

    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (progressRef.current) clearInterval(progressRef.current);
    disconnectPulse();

    try {
      const t = await api.getRandomTrack();
      setTrack(t);
      setLoading(false);

      const audio = new Audio(t.previewUrl);
      audio.crossOrigin = 'anonymous';
      audioRef.current = audio;
      const start = Date.now();
      const duration = 30;

      progressRef.current = window.setInterval(() => {
        const elapsed = (Date.now() - start) / 1000;
        setProgress(Math.min(elapsed / duration, 1));
        if (elapsed >= duration) {
          if (progressRef.current) clearInterval(progressRef.current);
          setPlaying(false);
          setRevealed(true);
          disconnectPulse();
        }
      }, 250);

      audio.play()
        .then(() => { setPlaying(true); connectAudio(audio); })
        .catch(() => setError('Could not play audio'));

      audio.addEventListener('ended', () => {
        setPlaying(false);
        if (progressRef.current) clearInterval(progressRef.current);
        setProgress(1);
        setRevealed(true);
        disconnectPulse();
      });
    } catch {
      setError('No track found. Roll again!');
      setLoading(false);
    }
  };

  const handleReveal = () => setRevealed(true);

  const handleNext = () => {
    setSessionCount((c) => c + 1);
    rollDice();
  };

  // ── Initial state: big Roll the Dice CTA ──
  if (!track && !loading && !error) {
    return (
      <div className="h-[100dvh] w-full fixed inset-0 overflow-hidden flex flex-col bg-surface sugar-rush-mesh font-body text-on-surface">
        <header className="shrink-0 bg-black/40 backdrop-blur-3xl border-b border-white/5 z-50">
          <div className="flex justify-between items-center px-6 h-14 w-full">
            <button onClick={() => navigate('/play')} className="flex items-center gap-2 active:scale-90 transition-transform cursor-pointer">
              <span className="material-symbols-outlined text-white/50">arrow_back</span>
            </button>
            <h1 className="text-2xl font-black italic text-on-surface tracking-tight font-headline">
              Que<span className="text-[#FFB347]">.</span>
            </h1>
            <div className="w-8" />
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
          {/* Mode Badge */}
          <div className="mode-badge">
            <span className="text-xs font-medium tracking-widest uppercase text-white/70">
              🎲 ENDLESS DISCOVERY
            </span>
          </div>

          {sessionCount > 0 && (
            <div className="text-center">
              <p className="text-xs font-bold text-white/30 uppercase tracking-widest">
                {sessionCount} song{sessionCount !== 1 ? 's' : ''} discovered
              </p>
            </div>
          )}
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-headline tracking-tight font-bold text-white">
              Find something new.
            </h2>
            <p className="text-sm text-white/40">Listen blind. Decide if it's a vibe.</p>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-full -z-10" />
            <button
              onPointerDown={hapticTap}
              onClick={rollDice}
              className="tropical-gradient text-white px-12 py-5 rounded-full font-headline shadow-2xl shadow-pink-500/20 active:scale-95 transition-all duration-300 text-lg font-extrabold uppercase tracking-widest"
            >
              Roll the Dice
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ── Player view ──
  return (
    <div className="h-[100dvh] w-full fixed inset-0 overflow-hidden flex flex-col bg-surface sugar-rush-mesh font-body text-on-surface">
      {/* Header */}
      <header className="shrink-0 bg-black/40 backdrop-blur-3xl border-b border-white/5 z-50">
        <div className="flex justify-between items-center px-6 h-14 w-full">
          <button onClick={() => navigate('/play')} className="flex items-center gap-2 active:scale-90 transition-transform cursor-pointer">
            <span className="material-symbols-outlined text-white/50">arrow_back</span>
          </button>
          <h1 className="text-2xl font-black italic text-on-surface tracking-tight font-headline">
            Que<span className="text-[#FFB347]">.</span>
          </h1>
          <div className="flex items-center gap-1">
            {sessionCount > 0 && (
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider">{sessionCount}</span>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 min-h-0 flex flex-col items-center justify-center relative px-6 py-4 overflow-hidden">
        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="spinner" />
            <p className="text-sm text-muted font-medium">Rolling the dice...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex flex-col items-center justify-center gap-4">
            <span className="material-symbols-outlined text-5xl text-primary">casino</span>
            <p className="text-sm text-error font-medium">{error}</p>
            <button
              onPointerDown={hapticTap}
              onClick={rollDice}
              className="tropical-gradient text-white px-8 py-3 rounded-full font-headline shadow-2xl shadow-pink-500/20 active:scale-95 transition-all duration-300 text-sm font-extrabold uppercase tracking-widest mt-2"
            >
              Roll Again
            </button>
          </div>
        )}

        {/* Track loaded */}
        {track && !error && (
          <div className="flex flex-col items-center w-full max-w-sm gap-4">
            {/* Mode Badge */}
            <div className="mode-badge">
              <span className="text-xs font-medium tracking-widest uppercase text-white/70">
                🎲 ENDLESS DISCOVERY
              </span>
            </div>

            {/* Header */}
            <div className="text-center shrink-0">
              <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter text-white mb-1 leading-none font-headline">
                Vibe or Nah?
              </h1>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-white/40 font-label">The Blind Listen</p>
            </div>

            {/* Orb Visualizer — replaces old SVG progress ring */}
            <div className="flex-1 min-h-0 flex items-center justify-center w-full">
              <OrbVisualizer
                playing={playing}
                scale={scale}
                albumArt={track.albumArt}
                revealed={revealed}
                size="lg"
              />
            </div>

            {/* Track info */}
            <div className="text-center shrink-0">
              {revealed ? (
                <>
                  <h2 className="text-2xl font-black italic tracking-tighter text-[#FF6B9D] uppercase font-headline">{track.title}</h2>
                  <p className="text-base font-bold text-white uppercase tracking-widest mt-1 font-headline">by {track.artist}</p>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-black italic tracking-tighter text-white/30 uppercase font-headline">???</h2>
                  <p className="text-sm font-bold text-white/20 uppercase tracking-widest mt-1 font-headline">
                    {playing ? `${formatTime(30 - progress * 30)} remaining` : 'Ready'}
                  </p>
                </>
              )}
            </div>

            {/* Pre-reveal: Vibe / Nope */}
            {!revealed && (
              <div className="shrink-0 flex flex-col items-center gap-3 w-full">
                <div className="flex gap-5 w-full">
                  <button
                    onPointerDown={hapticTap}
                    onClick={() => { if (!vibe) setVibe('VIBE'); }}
                    disabled={!!vibe}
                    className={`vibe-pill-glass flex-1 py-4 rounded-full flex items-center justify-center gap-3 transition-all text-accent-yellow ${
                      vibe === 'VIBE'
                        ? 'ring-2 ring-yellow-400/50 shadow-[0_0_30px_rgba(250,204,21,0.3)] scale-[1.03]'
                        : vibe === 'NOPE' ? 'opacity-30 pointer-events-none' : 'active:scale-95'
                    }`}
                  >
                    <span className="material-symbols-outlined font-bold glow-text-yellow" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                    <span className="text-xs font-black uppercase tracking-widest glow-text-yellow">Vibe</span>
                  </button>
                  <button
                    onPointerDown={hapticTap}
                    onClick={() => { if (!vibe) { setVibe('NOPE'); handleReveal(); } }}
                    disabled={!!vibe}
                    className={`nope-pill-glass flex-1 py-4 rounded-full flex items-center justify-center gap-3 transition-all text-primary ${
                      vibe === 'NOPE'
                        ? 'ring-2 ring-rose-400/50 shadow-[0_0_30px_rgba(236,72,153,0.3)]'
                        : vibe === 'VIBE' ? 'opacity-30 pointer-events-none' : 'active:scale-95'
                    }`}
                  >
                    <span className="material-symbols-outlined font-bold glow-text-pink">close</span>
                    <span className="text-xs font-black uppercase tracking-widest glow-text-pink">Nope</span>
                  </button>
                </div>
                {vibe === 'VIBE' && (
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-yellow/70 animate-pulse">
                    Locked in — revealing when the beat drops
                  </p>
                )}
              </div>
            )}

            {/* Post-reveal */}
            {revealed && (
              <div className="shrink-0 flex flex-col items-center gap-3 w-full">
                <a
                  href={`https://open.spotify.com/track/${track.spotifyId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-spotify w-full flex items-center justify-center gap-2 min-h-[44px] rounded-full no-underline text-sm"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
                  Open in Spotify
                </a>

                <button
                  onPointerDown={hapticTap}
                  onClick={handleNext}
                  className="tropical-gradient text-white w-full min-h-[44px] rounded-full font-headline shadow-2xl shadow-pink-500/20 active:scale-95 transition-all duration-300 text-sm font-extrabold uppercase tracking-widest"
                >
                  Next
                </button>

                <button
                  onPointerDown={hapticTap}
                  onClick={() => navigate('/play')}
                  className="text-xs font-bold text-muted uppercase tracking-wider py-2 min-h-[36px] active:scale-95 transition-transform"
                >
                  Back to Play
                </button>
              </div>
            )}

            {/* Decrypting indicator */}
            {!revealed && playing && (
              <div className="shrink-0 flex flex-col items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-yellow shadow-[0_0_10px_#facc15] animate-pulse" />
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-accent-yellow">Decrypting</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
