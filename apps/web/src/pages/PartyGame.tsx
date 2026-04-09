import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { hapticTap, hapticConfirm, hapticError } from '../lib/haptics';
import { useBassPulse } from '../lib/useBassPulse';
import OrbVisualizer from '../components/OrbVisualizer';

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const CLIENT_FALLBACK_ARTISTS = [
  'Drake', 'Taylor Swift', 'Billie Eilish', 'The Weeknd', 'Dua Lipa',
  'Kendrick Lamar', 'Olivia Rodrigo', 'Bad Bunny', 'SZA', 'Harry Styles',
  'Doja Cat', 'Post Malone', 'Ariana Grande', 'Travis Scott', 'Beyoncé',
];

/** Build exactly 4 unique choices with the correct artist always included. */
function buildChoices(correctArtist: string, decoys: string[]): string[] {
  const lower = correctArtist.toLowerCase();
  // Remove any decoy that duplicates the correct artist
  const uniqueDecoys = decoys.filter(d => d.toLowerCase() !== lower);

  // If we don't have 3 unique decoys, pad from the client fallback list
  if (uniqueDecoys.length < 3) {
    const pool = shuffle(
      CLIENT_FALLBACK_ARTISTS.filter(n => n.toLowerCase() !== lower && !uniqueDecoys.some(d => d.toLowerCase() === n.toLowerCase())),
    );
    while (uniqueDecoys.length < 3 && pool.length > 0) {
      uniqueDecoys.push(pool.pop()!);
    }
  }

  // Explicitly construct [correct, decoy1, decoy2, decoy3] then shuffle
  return shuffle([correctArtist, ...uniqueDecoys.slice(0, 3)]);
}

const GENRES = [
  { id: 'pop', label: 'Pop' },
  { id: 'hip-hop', label: 'Hip-Hop' },
  { id: 'rock', label: 'Rock' },
  { id: 'r-n-b', label: 'R&B' },
  { id: 'country', label: 'Country' },
  { id: 'latin', label: 'Latin' },
  { id: 'electronic', label: 'Electronic' },
  { id: 'indie', label: 'Indie' },
];

type Phase = 'setup' | 'playing' | 'ended';

export default function PartyGame() {
  const navigate = useNavigate();

  // Setup state
  const [genre, setGenre] = useState<string | null>(null);

  // Game state
  const [phase, setPhase] = useState<Phase>('setup');
  const [track, setTrack] = useState<any>(null);
  const [choices, setChoices] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [picked, setPicked] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  // Score tracking
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  // Audio refs
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

  const stopAudio = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (progressRef.current) { clearInterval(progressRef.current); progressRef.current = null; }
    disconnectPulse();
  }, [disconnectPulse]);

  const loadRound = useCallback(async () => {
    if (loading) return; // Prevent concurrent API calls on rapid clicks
    setLoading(true);
    setTrack(null);
    setPicked(null);
    setRevealed(false);
    setPlaying(false);
    setProgress(0);
    setError('');
    stopAudio();

    try {
      const t = await api.getRandomTrack(genre || undefined);
      setTrack(t);

      // Build exactly 4 choices — correct artist is always guaranteed present
      setChoices(buildChoices(t.artist, t.decoyArtists || []));
      setLoading(false);

      if (!t.previewUrl) {
        setError('No preview available. Try again!');
        return;
      }

      // Auto-play
      const audio = new Audio(t.previewUrl);
      audio.crossOrigin = 'anonymous';
      audioRef.current = audio;
      const start = Date.now();

      progressRef.current = window.setInterval(() => {
        const elapsed = (Date.now() - start) / 1000;
        setProgress(Math.min(elapsed / 30, 1));
        if (elapsed >= 30) {
          if (progressRef.current) clearInterval(progressRef.current);
          setPlaying(false);
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
        disconnectPulse();
      }, { once: true });
    } catch {
      setError('No track found. Try again!');
      setLoading(false);
    }
  }, [loading, genre, stopAudio, connectAudio, disconnectPulse]);

  const handleStartGame = () => {
    setPhase('playing');
    setCorrect(0);
    setTotal(0);
    setStreak(0);
    setBestStreak(0);
    loadRound();
  };

  const handlePick = (artist: string) => {
    if (picked) return;
    setPicked(artist);
    setRevealed(true);

    const isCorrect = artist === track.artist;
    setTotal((t) => t + 1);

    if (isCorrect) {
      hapticConfirm();
      setCorrect((c) => c + 1);
      setStreak((s) => {
        const next = s + 1;
        setBestStreak((b) => Math.max(b, next));
        return next;
      });
    } else {
      hapticError();
      setStreak(0);
    }
  };

  const handleNextRound = () => loadRound();

  const handleEndGame = () => {
    stopAudio();
    setPhase('ended');
  };

  const handlePlayAgain = () => {
    setPhase('setup');
    setGenre(null);
  };

  // ═══════════════════════════════════════
  // ── SETUP SCREEN ──
  // ═══════════════════════════════════════
  if (phase === 'setup') {
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

        <main className="flex-1 min-h-0 flex flex-col items-center px-6 py-4 overflow-hidden">
          <div className="w-full max-w-sm flex flex-col flex-1 min-h-0 items-center gap-6">
            {/* Mode Badge */}
            <div className="mode-badge">
              <span className="text-xs font-medium tracking-widest uppercase text-white/70">
                🎯 PARTY MODE
              </span>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl tropical-gradient flex items-center justify-center mx-auto mb-4 shadow-lg shadow-pink-500/20">
                <span className="material-symbols-outlined text-white text-3xl">target</span>
              </div>
              <h2 className="text-2xl font-black italic tracking-tighter text-white font-headline">How do you want to play?</h2>
              <p className="text-sm text-white/40 mt-1">Pick a genre or go fully random.</p>
            </div>

            {/* Random option */}
            <button
              onPointerDown={hapticTap}
              onClick={() => setGenre(null)}
              className={`w-full glass-card p-4 flex items-center gap-4 text-left active:scale-[0.98] transition-all cursor-pointer ${
                genre === null ? 'ring-2 ring-[#FF1493]/50 shadow-[0_0_20px_rgba(255,20,147,0.15)]' : ''
              }`}
            >
              <span className="material-symbols-outlined text-2xl text-[#FF1493]">casino</span>
              <div>
                <h3 className="font-bold text-white font-headline">Random</h3>
                <p className="text-xs text-white/40">Anything goes</p>
              </div>
              {genre === null && <span className="material-symbols-outlined text-[#FF1493] ml-auto">check_circle</span>}
            </button>

            {/* Genre grid */}
            <div className="w-full flex-1 min-h-0 overflow-y-auto py-4">
              <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3 text-center">Or pick a genre</p>
              <div className="grid grid-cols-2 gap-2">
                {GENRES.map((g) => (
                  <button
                    key={g.id}
                    onPointerDown={hapticTap}
                    onClick={() => setGenre(g.id)}
                    className={`py-3 px-4 rounded-xl text-sm font-bold transition-all active:scale-[0.97] font-headline ${
                      genre === g.id
                        ? 'tropical-gradient text-white shadow-lg shadow-pink-500/20'
                        : 'bg-white/10 backdrop-blur-md border border-white/10 text-white/60 hover:text-white/80'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Start button */}
            <button
              onPointerDown={hapticTap}
              onClick={handleStartGame}
              className="w-full tropical-gradient text-white min-h-[52px] rounded-full font-headline shadow-2xl shadow-pink-500/20 active:scale-95 transition-all duration-300 text-base font-extrabold uppercase tracking-widest"
            >
              Start Game
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ═══════════════════════════════════════
  // ── END SCREEN ──
  // ═══════════════════════════════════════
  if (phase === 'ended') {
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    return (
      <div className="h-[100dvh] w-full fixed inset-0 overflow-hidden flex flex-col bg-surface sugar-rush-mesh font-body text-on-surface">
        <header className="shrink-0 bg-black/40 backdrop-blur-3xl border-b border-white/5 z-50">
          <div className="flex justify-between items-center px-6 h-14 w-full">
            <div className="w-8" />
            <h1 className="text-2xl font-black italic text-on-surface tracking-tight font-headline">
              Que<span className="text-[#FFB347]">.</span>
            </h1>
            <div className="w-8" />
          </div>
        </header>

        <main className="flex-1 min-h-0 flex flex-col items-center justify-center px-6 py-8">
          <div className="w-full max-w-sm flex flex-col items-center gap-8">
            {/* Mode Badge */}
            <div className="mode-badge">
              <span className="text-xs font-medium tracking-widest uppercase text-white/70">
                🎯 PARTY MODE
              </span>
            </div>

            {/* Score display */}
            <div className="text-center">
              <div className="text-6xl font-black italic text-[#FF6B9D] font-headline mb-2">
                {correct}/{total}
              </div>
              <p className="text-lg font-bold text-white/60 font-headline">{pct}% correct</p>
            </div>

            {/* Stats */}
            <div className="flex gap-4 w-full">
              <div className="flex-1 glass-card p-4 text-center">
                <div className="text-2xl font-black text-[#FF1493] font-headline">{bestStreak}</div>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Best Streak</p>
              </div>
              <div className="flex-1 glass-card p-4 text-center">
                <div className="text-2xl font-black text-accent-yellow font-headline">{total}</div>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Songs Played</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 w-full">
              <button
                onPointerDown={hapticTap}
                onClick={handlePlayAgain}
                className="w-full tropical-gradient text-white min-h-[48px] rounded-full font-headline shadow-2xl shadow-pink-500/20 active:scale-95 transition-all duration-300 text-sm font-extrabold uppercase tracking-widest"
              >
                Play Again
              </button>
              <button
                onPointerDown={hapticTap}
                onClick={() => navigate('/play')}
                className="text-xs font-bold text-muted uppercase tracking-wider py-2 min-h-[36px] active:scale-95 transition-transform"
              >
                Back to Play
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ═══════════════════════════════════════
  // ── GAMEPLAY SCREEN ──
  // ═══════════════════════════════════════
  return (
    <div className="h-[100dvh] w-full fixed inset-0 overflow-hidden flex flex-col bg-surface sugar-rush-mesh font-body text-on-surface">
      {/* Header with streak */}
      <header className="shrink-0 bg-black/40 backdrop-blur-3xl border-b border-white/5 z-50">
        <div className="flex justify-between items-center px-6 h-14 w-full">
          <button onPointerDown={hapticTap} onClick={handleEndGame} className="text-xs font-bold text-white/40 uppercase tracking-wider active:scale-95 transition-transform">
            End
          </button>
          <h1 className="text-2xl font-black italic text-on-surface tracking-tight font-headline">
            Que<span className="text-[#FFB347]">.</span>
          </h1>
          <div className="flex items-center gap-1.5">
            {streak > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FF1493]/15 text-[#FF1493]">
                {streak}
              </span>
            )}
            <span className="text-xs font-bold text-white/30">{correct}/{total}</span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 min-h-0 flex flex-col items-center justify-center relative px-6 py-4 overflow-hidden">
        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="spinner" />
            <p className="text-sm text-muted font-medium">Loading next track...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex flex-col items-center justify-center gap-4">
            <span className="material-symbols-outlined text-5xl text-[#FF1493]">error</span>
            <p className="text-sm text-error font-medium">{error}</p>
            <button
              onPointerDown={hapticTap}
              onClick={loadRound}
              className="tropical-gradient text-white px-8 py-3 rounded-full font-headline shadow-2xl shadow-pink-500/20 active:scale-95 transition-all duration-300 text-sm font-extrabold uppercase tracking-widest mt-2"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Track loaded — gameplay */}
        {track && !error && (
          <div className="flex flex-col items-center w-full max-w-sm gap-3">
            {/* Mode Badge */}
            <div className="mode-badge">
              <span className="text-xs font-medium tracking-widest uppercase text-white/70">
                🎯 PARTY MODE
              </span>
            </div>

            {/* Orb Visualizer — replaces old SVG progress ring */}
            <OrbVisualizer
              playing={playing}
              scale={scale}
              albumArt={track.albumArt}
              revealed={revealed}
              size="sm"
            />

            {/* Timer / track info */}
            <div className="text-center shrink-0">
              {revealed ? (
                <>
                  <h2 className="text-xl font-black italic tracking-tighter text-[#FF6B9D] uppercase font-headline">{track.title}</h2>
                  <p className="text-sm font-bold text-white uppercase tracking-widest mt-0.5 font-headline">by {track.artist}</p>
                </>
              ) : (
                <p className="text-sm font-bold text-white/20 uppercase tracking-widest font-headline">
                  {playing ? `${formatTime(30 - progress * 30)} remaining` : '???'}
                </p>
              )}
            </div>

            {/* Artist choices — always visible */}
            <div className="w-full flex flex-col gap-2 mt-2">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest text-center mb-1">
                {revealed ? (picked === track.artist ? 'Correct!' : 'Wrong!') : 'Who is this artist?'}
              </p>
              {choices.map((artist) => {
                const isReal = artist === track.artist;
                const isPicked = artist === picked;
                let style = 'bg-white/10 backdrop-blur-md border border-white/10 text-white/80 active:scale-[0.97]';

                if (revealed) {
                  if (isReal) {
                    style = 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 border-2 border-emerald-400/50 text-emerald-300';
                  } else if (isPicked && !isReal) {
                    style = 'bg-red-500/10 border-2 border-red-400/30 text-red-300/60';
                  } else {
                    style = 'bg-white/5 border border-white/5 text-white/20';
                  }
                }

                return (
                  <button
                    key={artist}
                    onPointerDown={hapticTap}
                    onClick={() => handlePick(artist)}
                    disabled={revealed}
                    className={`w-full py-3.5 px-4 rounded-xl text-sm font-bold transition-all font-headline ${style}`}
                  >
                    {artist}
                    {revealed && isReal && (
                      <span className="ml-2">✓</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Post-reveal actions */}
            {revealed && (
              <div className="flex gap-3 w-full mt-2">
                <button
                  onPointerDown={hapticTap}
                  onClick={handleNextRound}
                  className="flex-1 tropical-gradient text-white min-h-[44px] rounded-full font-headline shadow-2xl shadow-pink-500/20 active:scale-95 transition-all duration-300 text-sm font-extrabold uppercase tracking-widest"
                >
                  Next Song
                </button>
                <button
                  onPointerDown={hapticTap}
                  onClick={handleEndGame}
                  className="px-6 min-h-[44px] rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white/60 font-headline text-sm font-bold active:scale-95 transition-all"
                >
                  End
                </button>
              </div>
            )}

            {/* Streak indicator during play */}
            {!revealed && streak > 0 && (
              <div className="shrink-0 flex items-center gap-2 mt-1">
                <span className="text-[#FF1493] text-sm">🔥</span>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF1493]/70">{streak} in a row</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
