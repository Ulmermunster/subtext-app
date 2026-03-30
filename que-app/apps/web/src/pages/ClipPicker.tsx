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
  const [gameMode, setGameMode] = useState<'vibe' | 'guess'>('vibe');

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

  if (!track) {
    return (
      <div className="w-full max-w-md mx-auto px-5 py-8">
        <p className="text-muted">No track selected.</p>
        <button onClick={() => navigate('/send')} className="text-gold text-sm mt-2 font-semibold min-h-[44px]">← Back to search</button>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="w-full max-w-md mx-auto px-5 flex flex-col items-center" style={{ minHeight: '100dvh', paddingTop: 'max(1.5rem, env(safe-area-inset-top))', paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
        <div className="w-full flex items-center mb-6">
          <button onClick={() => navigate('/')} className="text-muted text-lg w-10 h-10 flex items-center justify-center">←</button>
        </div>
        <h1 className="text-4xl font-extrabold text-ink tracking-tight mb-1">
          Que'd<span className="text-gold">.</span>
        </h1>
        <p className="text-muted text-sm mb-6">
          {gameMode === 'guess' ? 'Guessing game sent.' : 'Send this blind clip.'}
        </p>
        <div className="relative mb-8">
          <img src={track.albumArt} alt="" className="w-40 h-40 rounded-3xl object-cover shadow-card-hover border-4 border-white" style={{ transform: 'rotate(-3deg)' }} />
          <div className="absolute -bottom-3 -right-3 w-11 h-11 rounded-full bg-ink border-4 border-white flex items-center justify-center">
            {gameMode === 'guess' ? (
              <span className="text-lg">🎯</span>
            ) : (
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                <path d="M3 8L6.5 11.5L13 5" stroke="#F5A623" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
        </div>
        <div className="flex-1" />
        <div className="flex gap-3 w-full mb-4">
          <button onPointerDown={hapticTap} onClick={handleSms} className="btn-primary flex-1 flex items-center justify-center gap-2 min-h-[48px]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
            SMS
          </button>
          <button onPointerDown={hapticTap} onClick={handleCopy} className="flex-1 card p-3.5 font-bold text-ink flex items-center justify-center gap-2 hover:shadow-card-hover transition-all min-h-[48px]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <button onClick={() => navigate('/send')} className="text-xs font-bold text-muted uppercase tracking-wider py-3 min-h-[44px]">
          Start Over
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto px-5 flex flex-col" style={{ minHeight: '100dvh', paddingTop: 'max(1rem, env(safe-area-inset-top))', paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
      <div className="flex items-center gap-4 py-2">
        <button onClick={() => navigate(-1)} className="text-muted text-lg w-10 h-10 flex items-center justify-center">←</button>
        <button onClick={() => navigate('/send')} className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center text-muted text-sm">
          ✕
        </button>
      </div>

      <div className="card p-4 flex items-center gap-3 mt-3">
        <img src={track.albumArt} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-bold text-ink truncate">{track.title}</div>
          <div className="text-muted text-sm truncate">{track.artist} · {track.albumName}</div>
          <div className="text-muted text-xs">{formatDuration(track.duration)}</div>
        </div>
      </div>

      <div className="card p-4 mt-4 text-center">
        <div className="text-lg mb-1">🎵</div>
        <div className="font-semibold text-ink text-sm">Auto clip</div>
        <div className="text-muted text-[11px] mt-0.5">Best 30 seconds selected automatically</div>
      </div>

      {/* Game mode toggle */}
      <div className="flex gap-2 mt-4">
        <button
          onPointerDown={hapticTap}
          onClick={() => setGameMode('vibe')}
          className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all min-h-[48px] ${
            gameMode === 'vibe'
              ? 'bg-ink text-white shadow-card'
              : 'bg-white border border-border text-muted'
          }`}
        >
          🎵 Mystery Vibe
        </button>
        <button
          onPointerDown={hapticTap}
          onClick={() => setGameMode('guess')}
          className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all min-h-[48px] ${
            gameMode === 'guess'
              ? 'bg-ink text-white shadow-card'
              : 'bg-white border border-border text-muted'
          }`}
        >
          🎯 Guessing Game
        </button>
      </div>
      <p className="text-[10px] text-muted text-center mt-1.5">
        {gameMode === 'guess'
          ? 'They guess the artist from 4 choices'
          : 'They listen blind, then react'}
      </p>

      <div className="flex-1" />

      <div className="relative mt-5">
        <input
          type="text"
          value={senderName}
          onChange={(e) => setSenderName(e.target.value)}
          placeholder="Your name"
          className="w-full px-4 py-3 rounded-card border-2 border-gold/30 bg-white text-ink placeholder:text-muted text-center font-medium focus:outline-none focus:border-gold min-h-[48px]"
        />
        <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-sky" />
      </div>

      {error && (
        <div className="card p-4 border-coral/30 mt-4">
          <p className="text-sm text-coral">{error}</p>
        </div>
      )}

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
