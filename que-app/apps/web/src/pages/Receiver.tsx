import { useParams } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';

interface VibeData {
  spotifyId: string;
  senderDisplayName: string;
  previewUrl?: string;
  mode: string;
  startSec?: number;
}

interface RevealData {
  albumArt: string;
  title: string;
  artist: string;
  albumName: string;
  spotifyUrl: string;
  reaction?: string;
}

export default function Receiver() {
  const { id: vibeId } = useParams<{ id: string }>();
  const [vibeData, setVibeData] = useState<VibeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ emoji: string; title: string; sub: string } | null>(null);
  const [playing, setPlaying] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [currentReaction, setCurrentReaction] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [remaining, setRemaining] = useState(30);
  const [revealData, setRevealData] = useState<RevealData | null>(null);
  const [orbBarsHeights] = useState(() =>
    Array.from({ length: 12 }, () => 20 + Math.random() * 30)
  );

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch vibe data on mount
  useEffect(() => {
    if (!vibeId) {
      setError({ emoji: '\u{1F914}', title: 'No clip found', sub: 'Check the link and try again.' });
      setLoading(false);
      return;
    }

    fetch(`/vibes/${vibeId}`)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((data) => {
        setVibeData(data);
        setLoading(false);
      })
      .catch((err) => {
        if (err.message === '404') {
          setError({ emoji: '\u{1F4A8}', title: 'This clip has expired', sub: 'Mystery clips only last 72 hours.' });
        } else {
          setError({ emoji: '\u{1F635}', title: 'Something went wrong', sub: 'Check your connection and try again.' });
        }
        setLoading(false);
      });
  }, [vibeId]);

  const handleOrbClick = useCallback(() => {
    if (revealed || !vibeData || playing) return;

    setPlaying(true);

    // Create Spotify embed (hidden, for audio playback)
    const iframe = document.createElement('iframe');
    let src = `https://open.spotify.com/embed/track/${vibeData.spotifyId}?utm_source=generator&theme=0`;
    if (vibeData.mode === 'PICK' && vibeData.startSec) {
      src += `&t=${vibeData.startSec}`;
    }
    iframe.src = src;
    iframe.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:300px;height:80px;border:0;opacity:0.01';
    document.body.appendChild(iframe);

    // Start 30-second clip timer
    const start = Date.now();
    const duration = 30;
    progressRef.current = setInterval(() => {
      const elapsedSec = (Date.now() - start) / 1000;
      const pct = Math.min(100, (elapsedSec / duration) * 100);
      setProgress(pct);
      setElapsed(Math.min(elapsedSec, duration));
      setRemaining(Math.max(0, duration - elapsedSec));
      if (elapsedSec >= duration) {
        if (progressRef.current) clearInterval(progressRef.current);
        triggerReveal();
      }
    }, 250);
  }, [vibeData, playing, revealed]);

  const handleReact = useCallback((type: string) => {
    if (revealed) return;
    setCurrentReaction(type);
    fetch(`/vibes/${vibeId}/react`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reaction: type }),
    }).catch(() => {});
  }, [vibeId, revealed]);

  const triggerReveal = useCallback(() => {
    setRevealed(true);
    if (progressRef.current) clearInterval(progressRef.current);

    setTimeout(() => {
      fetch(`/vibes/${vibeId}/reveal`)
        .then((r) => r.json())
        .then((data: RevealData) => {
          setRevealData(data);
          if ((data.reaction || currentReaction) === 'VIBE') {
            setTimeout(() => launchConfetti(), 780);
          }
        })
        .catch(() => {
          setError({ emoji: '\u{1F635}', title: 'Reveal failed', sub: 'Something went wrong loading the track info.' });
        });
    }, 400);
  }, [vibeId, currentReaction]);

  const launchConfetti = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#F5A623', '#FFD96A', '#F97316', '#10B981', '#3B82F6', '#EC4899'];
    const particles = Array.from({ length: 80 }, () => ({
      x: canvas.width / 2 + (Math.random() - 0.5) * 200,
      y: canvas.height * 0.4,
      vx: (Math.random() - 0.5) * 12,
      vy: -Math.random() * 14 - 4,
      w: 6 + Math.random() * 6,
      h: 4 + Math.random() * 8,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rv: (Math.random() - 0.5) * 10,
      alpha: 1,
    }));

    const gravity = 0.35;
    function frame() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      let alive = false;
      for (const p of particles) {
        p.vy += gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rv;
        if (p.y > canvas!.height * 0.85) p.alpha -= 0.03;
        if (p.alpha <= 0) continue;
        alive = true;
        ctx!.save();
        ctx!.translate(p.x, p.y);
        ctx!.rotate((p.rotation * Math.PI) / 180);
        ctx!.globalAlpha = Math.max(0, p.alpha);
        ctx!.fillStyle = p.color;
        ctx!.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx!.restore();
      }
      if (alive) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }, []);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const reaction = revealData?.reaction || currentReaction;

  // ---- Inline styles ----
  const styles = {
    container: {
      maxWidth: 420, margin: '0 auto', padding: '24px 20px', position: 'relative' as const,
      zIndex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center',
      minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
    },
    blob: (top: string, right: string, bottom: string, left: string, size: number, color: string) => ({
      position: 'fixed' as const, borderRadius: '50%', pointerEvents: 'none' as const, zIndex: 0,
      top, right, bottom, left, width: size, height: size,
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
    }),
    wordmark: { fontSize: 20, fontWeight: 800, color: '#1A1A2E', letterSpacing: -0.5, marginBottom: 24 },
    dot: { color: '#F5A623' },
    fromTag: { fontSize: 16, fontWeight: 600, color: '#1A1A2E', marginBottom: 32 },
    orbWrap: {
      position: 'relative' as const, width: 200, height: 200, marginBottom: 20, cursor: 'pointer',
      WebkitTapHighlightColor: 'transparent', userSelect: 'none' as const,
    },
    orb: {
      width: 200, height: 200, borderRadius: '50%',
      background: 'linear-gradient(135deg, #F5A623, #FFD96A)',
      border: '4px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative' as const, zIndex: 2, transition: 'transform .3s ease',
      boxShadow: '0 0 60px rgba(245,166,35,.2)',
    },
    orbEmoji: { fontSize: 56, opacity: playing ? 0 : 1, transition: 'opacity .3s ease' },
    orbHint: {
      position: 'absolute' as const, bottom: -28, left: 0, right: 0, textAlign: 'center' as const,
      fontSize: 12, color: '#9CA3AF', fontWeight: 500,
    },
    ring: (size: number, delay: number) => ({
      position: 'absolute' as const, top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)', borderRadius: '50%',
      border: '1.5px solid rgba(245,166,35,.25)', zIndex: 1,
      width: size, height: size, animation: `receiverPulse 2.5s ease-out infinite ${delay}s`,
    }),
    mystery: { fontSize: 18, fontWeight: 700, color: '#9CA3AF', margin: '24px 0 8px', letterSpacing: 1 },
    subtitle: { fontSize: 12, color: '#9CA3AF', fontWeight: 500 },
    scrubber: {
      width: '100%', maxWidth: 280, margin: '16px 0',
      opacity: playing ? 1 : 0, transition: 'opacity .3s ease',
    },
    scrubTrack: { width: '100%', height: 4, background: '#F0E6C8', borderRadius: 2, overflow: 'hidden' as const },
    scrubFill: {
      height: '100%', background: 'linear-gradient(90deg, #F5A623, #FFD96A)',
      borderRadius: 2, transition: 'width .3s linear', width: `${progress}%`,
    },
    scrubTimes: { display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 11, color: '#9CA3AF', fontWeight: 500 },
    reactions: {
      display: 'flex', gap: 16, margin: '24px 0',
      opacity: playing ? 1 : 0, transform: playing ? 'translateY(0)' : 'translateY(20px)',
      transition: 'opacity .4s ease, transform .4s ease',
    },
    reactBtn: (bg: string, selected: boolean) => ({
      border: 'none', borderRadius: 999, padding: '14px 36px', fontSize: 16, fontWeight: 700,
      cursor: 'pointer', transition: 'transform .15s ease, box-shadow .15s ease',
      display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit',
      background: bg, color: '#fff',
      boxShadow: selected ? `0 0 0 3px ${bg === '#10B981' ? 'rgba(16,185,129,.4)' : 'rgba(249,115,22,.4)'}` : 'none',
    }),
    hint: { fontSize: 12, color: '#9CA3AF', fontWeight: 500, textAlign: 'center' as const, margin: '8px 0' },
    revealLabel: { fontSize: 14, color: '#9CA3AF', fontWeight: 600 },
    albumArt: {
      width: 200, height: 200, borderRadius: 20, objectFit: 'cover' as const,
      boxShadow: '0 8px 40px rgba(0,0,0,.12)', border: '4px solid #fff',
      transform: 'scale(1) rotate(-2deg)',
    },
    revealTitle: { fontSize: 28, fontWeight: 800, color: '#1A1A2E', textAlign: 'center' as const },
    revealMeta: { fontSize: 16, color: '#9CA3AF', fontWeight: 500, textAlign: 'center' as const },
    reactionBadge: (type: string) => ({
      borderRadius: 999, padding: '10px 24px', fontSize: 14, fontWeight: 700,
      background: type === 'VIBE' ? 'rgba(16,185,129,.1)' : 'rgba(249,115,22,.1)',
      color: type === 'VIBE' ? '#10B981' : '#F97316',
    }),
    spotifyCta: {
      display: 'inline-flex', alignItems: 'center', gap: 8, background: '#1DB954', color: '#fff',
      borderRadius: 999, padding: '14px 28px', fontSize: 14, fontWeight: 700, textDecoration: 'none', marginTop: 8,
    },
    sendbackCta: {
      display: 'inline-flex', alignItems: 'center', gap: 6, background: '#1A1A2E', color: '#fff',
      borderRadius: 999, padding: '14px 28px', fontSize: 14, fontWeight: 700, textDecoration: 'none', marginTop: 8,
    },
    canvas: { position: 'fixed' as const, top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' as const, zIndex: 100 },
    spinner: {
      width: 24, height: 24, border: '2px solid #F0E6C8', borderTopColor: '#F5A623',
      borderRadius: '50%', animation: 'receiverSpin .6s linear infinite', margin: '0 auto',
    },
    errorState: { textAlign: 'center' as const, padding: '40px 20px' },
    errorEmoji: { fontSize: 48, marginBottom: 16 },
    errorTitle: { fontSize: 20, fontWeight: 700, marginBottom: 8 },
    errorSub: { fontSize: 14, color: '#9CA3AF' },
    orbBars: {
      display: 'flex', alignItems: 'center', gap: 3, height: 60,
      opacity: playing ? 1 : 0, position: 'absolute' as const, transition: 'opacity .4s ease',
    },
  };

  // ---- Render ----

  // Loading state
  if (loading) {
    return (
      <>
        <style>{`
          @keyframes receiverSpin { to { transform: rotate(360deg) } }
        `}</style>
        <div style={styles.container}>
          <div style={styles.errorState}>
            <div style={styles.spinner} />
          </div>
        </div>
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorState}>
          <div style={styles.errorEmoji}>{error.emoji}</div>
          <div style={styles.errorTitle}>{error.title}</div>
          <div style={styles.errorSub}>{error.sub}</div>
        </div>
      </div>
    );
  }

  // Reveal state
  if (revealed && revealData) {
    return (
      <>
        <canvas ref={canvasRef} style={styles.canvas} />
        <div style={styles.container}>
          <div style={styles.wordmark}>Que<span style={styles.dot}>.</span></div>
          <div style={styles.revealLabel}>The song was...</div>
          <img style={styles.albumArt} src={revealData.albumArt} alt="" />
          <div style={styles.revealTitle}>{revealData.title}</div>
          <div style={styles.revealMeta}>{revealData.artist} &middot; {revealData.albumName}</div>
          {reaction && (
            <div style={styles.reactionBadge(reaction)}>
              {reaction === 'VIBE' ? '\u{1F44D} You vibed with this' : '\u{1F44E} Not your vibe \u2014 fair enough'}
            </div>
          )}
          <a style={styles.spotifyCta} href={revealData.spotifyUrl} target="_blank" rel="noopener noreferrer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
            Open in Spotify
          </a>
          <a style={styles.sendbackCta} href="/send">{'\u{1F3B5}'} Que one back</a>
        </div>
      </>
    );
  }

  // Landing state (main receiver UI)
  return (
    <>
      <style>{`
        @keyframes receiverSpin { to { transform: rotate(360deg) } }
        @keyframes receiverPulse {
          0% { transform: translate(-50%, -50%) scale(.95); opacity: .6 }
          100% { transform: translate(-50%, -50%) scale(1.15); opacity: 0 }
        }
        @keyframes receiverWave {
          0% { height: 12px }
          100% { height: var(--h, 40px) }
        }
      `}</style>
      <canvas ref={canvasRef} style={styles.canvas} />
      <div style={styles.container}>
        <div style={styles.wordmark}>Que<span style={styles.dot}>.</span></div>
        <div style={styles.fromTag}>
          {vibeData?.senderDisplayName} que'd you a song {'\u{1F440}'}
        </div>

        {/* Orb */}
        <div style={styles.orbWrap} onClick={handleOrbClick}>
          <div style={styles.ring(230, 0)} />
          <div style={styles.ring(260, 0.4)} />
          <div style={styles.orb}>
            <span style={styles.orbEmoji}>{'\u{1F3B5}'}</span>
            <div style={styles.orbBars}>
              {orbBarsHeights.map((h, i) => (
                <div
                  key={i}
                  style={{
                    width: 4, borderRadius: 2, background: '#1A1A2E',
                    animation: `receiverWave 1.2s ease-in-out infinite alternate ${i * 0.08}s`,
                    ['--h' as string]: `${h}px`,
                  }}
                />
              ))}
            </div>
          </div>
          <div style={styles.orbHint}>{playing ? '' : 'tap to play'}</div>
        </div>

        <div style={styles.mystery}>??? &middot; ???</div>
        <div style={styles.subtitle}>no artist &middot; no title &middot; no skipping</div>

        {/* Scrubber */}
        <div style={styles.scrubber}>
          <div style={styles.scrubTrack}>
            <div style={styles.scrubFill} />
          </div>
          <div style={styles.scrubTimes}>
            <span>{formatTime(elapsed)}</span>
            <span>{formatTime(remaining)}</span>
          </div>
        </div>

        {/* Reactions */}
        <div style={styles.reactions}>
          <button
            style={styles.reactBtn('#10B981', currentReaction === 'VIBE')}
            onClick={() => handleReact('VIBE')}
          >
            {'\u{1F44D}'} Vibe
          </button>
          <button
            style={styles.reactBtn('#F97316', currentReaction === 'NOPE')}
            onClick={() => handleReact('NOPE')}
          >
            {'\u{1F44E}'} Nope
          </button>
        </div>

        <div style={styles.hint}>
          {currentReaction
            ? `${currentReaction === 'VIBE' ? '\u{1F44D}' : '\u{1F44E}'} locked in \u2014 artist reveals at the end`
            : playing ? 'artist reveals at the end' : ''}
        </div>
      </div>
    </>
  );
}
