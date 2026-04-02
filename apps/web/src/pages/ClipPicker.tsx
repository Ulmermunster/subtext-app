import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { openSms, copyLink } from '../lib/sms';
import { hapticTap } from '../lib/haptics';

const TRACK_STORAGE_KEY = 'que_pending_track';

function formatDuration(ms: number) {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export default function ClipPicker() {
  const location = useLocation();
  const navigate = useNavigate();
  const track = (location.state as any)?.track || (() => {
    try { const r = localStorage.getItem(TRACK_STORAGE_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
  })();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [vibeId, setVibeId] = useState('');
  const [senderName, setSenderName] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [gameMode, setGameMode] = useState<'vibe' | 'guess'>(
    (location.state as any)?.defaultGameMode === 'guess' ? 'guess' : 'vibe'
  );

  const handleGenerate = async () => {
    if (!track) return;
    setSending(true);
    setError('');
    try {
      const result = await api.createVibe({
        trackId: track.spotifyId,
        mode: 'AUTO',
        senderDisplayName: senderName || undefined,
        gameMode,
      });
      setVibeId(result.vibeId);
      setSent(true);
      try { localStorage.removeItem(TRACK_STORAGE_KEY); } catch {}
    } catch (err: any) {
      if (err.body?.error === 'no_preview') {
        setError(err.body.message);
      } else {
        setError(err.message || 'Failed to create link');
      }
    } finally {
      setSending(false);
    }
  };

  const handleSms = () => {
    const displayName = senderName || 'Someone';
    openSms(displayName, vibeId, window.location.origin);
  };

  const handleCopy = async () => {
    const displayName = senderName || 'Someone';
    await copyLink(displayName, vibeId, window.location.origin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── No track fallback ──
  if (!track) {
    return (
      <div className="w-full max-w-md mx-auto px-5 py-8">
        <p className="text-muted font-body">No track selected.</p>
        <button onClick={() => navigate('/send')} className="text-primary text-sm mt-2 font-semibold min-h-[44px] font-headline">← Back to search</button>
      </div>
    );
  }

  // ── Sent confirmation ──
  if (sent) {
    return (
      <div
        className="mesh-gradient w-full max-w-md mx-auto px-5 flex flex-col items-center"
        style={{
          minHeight: '100dvh',
          paddingTop: 'max(1.5rem, env(safe-area-inset-top))',
          paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
        }}
      >
        {/* Back */}
        <div className="w-full flex items-center mb-6">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-primary text-lg active:scale-95 transition-transform"
          >
            ←
          </button>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-black italic text-primary tracking-tighter mb-1 font-headline">
          Que'd<span className="text-primary-container">.</span>
        </h1>
        <p className="text-muted text-sm mb-6 font-body">
          {gameMode === 'guess' ? 'Guessing game sent.' : 'Send this blind clip.'}
        </p>

        {/* Album art with badge — large & centered */}
        <div className="flex-1 flex items-center justify-center">
          <div className="relative">
            <img
              src={track.albumArt}
              alt=""
              className="w-64 h-64 rounded-[2rem] object-cover border-none"
              style={{
                transform: 'rotate(-3deg)',
                boxShadow: '0 16px 64px rgba(0,0,0,.4), 0 0 0 3px #FF1493, 0 0 30px rgba(255,20,147,.3)',
              }}
            />
            <div className="absolute -bottom-3 -right-3 w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-container border-4 border-surface flex items-center justify-center shadow-lg">
              {gameMode === 'guess' ? (
                <span className="text-xl">🎯</span>
              ) : (
                <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8L6.5 11.5L13 5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 w-full mb-4">
          <button
            onPointerDown={hapticTap}
            onClick={handleSms}
            className="btn-primary flex-1 flex items-center justify-center gap-2 min-h-[48px]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
            SMS
          </button>
          <button
            onPointerDown={hapticTap}
            onClick={handleCopy}
            className="flex-1 glass-card p-3.5 font-bold text-ink flex items-center justify-center gap-2 hover:shadow-card-hover transition-all min-h-[48px] active:scale-[0.97] font-headline"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <button
          onClick={() => navigate('/send')}
          className="text-xs font-bold text-muted uppercase tracking-wider py-3 min-h-[44px] font-body"
        >
          Start Over
        </button>
      </div>
    );
  }

  // ── Main clip picker form ──
  return (
    <div
      className="w-full max-w-md mx-auto px-5 flex flex-col"
      style={{
        minHeight: '100dvh',
        paddingTop: 'max(1rem, env(safe-area-inset-top))',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
      }}
    >
      {/* Top bar */}
      <div className="flex items-center gap-4 py-2">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-primary text-lg active:scale-95 transition-transform"
        >
          ←
        </button>
        <button
          onClick={() => navigate('/send')}
          className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-muted text-sm active:scale-95 transition-transform"
        >
          ✕
        </button>
      </div>

      {/* Track info card */}
      <div className="glass-card p-4 flex items-center gap-3 mt-3">
        <img src={track.albumArt} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0 shadow-sm" />
        <div className="flex-1 min-w-0">
          <div className="font-bold text-ink truncate font-headline">{track.title}</div>
          <div className="text-muted text-sm truncate font-body">{track.artist} · {track.albumName}</div>
          <div className="text-muted text-xs font-body">{formatDuration(track.duration)}</div>
        </div>
      </div>

      {/* Auto clip info */}
      <div className="glass-card p-4 mt-4 text-center">
        <div className="text-lg mb-1">🎵</div>
        <div className="font-semibold text-ink text-sm font-headline">Auto clip</div>
        <div className="text-muted text-[11px] mt-0.5 font-body">Best 30 seconds selected automatically</div>
      </div>

      {/* Game mode toggle */}
      <div className="flex gap-2 mt-4">
        <button
          onPointerDown={hapticTap}
          onClick={() => setGameMode('vibe')}
          className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all min-h-[48px] font-headline ${
            gameMode === 'vibe'
              ? 'bg-gradient-to-br from-primary to-primary-container text-white shadow-card'
              : 'bg-white/20 backdrop-blur-md border border-white/30 text-muted'
          }`}
        >
          🎵 Mystery Vibe
        </button>
        <button
          onPointerDown={hapticTap}
          onClick={() => setGameMode('guess')}
          className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all min-h-[48px] font-headline ${
            gameMode === 'guess'
              ? 'bg-gradient-to-br from-primary to-primary-container text-white shadow-card'
              : 'bg-white/20 backdrop-blur-md border border-white/30 text-muted'
          }`}
        >
          🎯 Guessing Game
        </button>
      </div>
      <p className="text-[10px] text-muted text-center mt-1.5 font-body">
        {gameMode === 'guess'
          ? 'They guess the artist from 4 choices'
          : 'They listen blind, then react'}
      </p>

      <div className="flex-1" />

      {/* Sender name input */}
      <div className="relative mt-5">
        <input
          type="text"
          value={senderName}
          onChange={(e) => setSenderName(e.target.value)}
          placeholder="Your name"
          className="w-full px-4 py-3 rounded-card border-2 border-primary/20 bg-white/10 backdrop-blur-md text-ink placeholder:text-muted text-center font-medium focus:outline-none focus:border-primary min-h-[48px] font-body"
        />
        <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-secondary-container" />
      </div>

      {/* Error */}
      {error && (
        <div className="glass-card p-4 border-error/30 mt-4">
          <p className="text-sm text-error font-body">{error}</p>
        </div>
      )}

      {/* Generate button */}
      <button
        onPointerDown={hapticTap}
        onClick={handleGenerate}
        disabled={sending}
        className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 min-h-[48px] mt-4 mb-2"
      >
        {sending ? <div className="spinner" /> : (
          gameMode === 'guess' ? <>Send Guessing Game 🎯</> : <>Generate Mystery Link ✦</>
        )}
      </button>
    </div>
  );
}
