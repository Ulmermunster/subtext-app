import { useState, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ModeToggle from '../components/ModeToggle';
import WaveformPicker from '../components/WaveformPicker';
import { api } from '../lib/api';
import { openSms, copyLink } from '../lib/sms';
import { initSpotifyPlayer, playTrack, pauseTrack, destroyPlayer } from '../lib/spotifyPlayer';

function formatDuration(ms: number) {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function ClipPicker() {
  const location = useLocation();
  const navigate = useNavigate();
  const track = (location.state as any)?.track;
  const [mode, setMode] = useState<'AUTO' | 'PICK'>('AUTO');
  const [startSec, setStartSec] = useState(0);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [vibeId, setVibeId] = useState('');
  const [senderName, setSenderName] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [error, setError] = useState('');
  const [previewing, setPreviewing] = useState(false);
  const [premiumError, setPremiumError] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.getMe().then((u) => {
      setUser(u);
      setSenderName(u.displayName || '');
    }).catch(() => {});
    return () => destroyPlayer();
  }, []);

  const handleWindowChange = useCallback((sec: number) => {
    setStartSec(sec);
  }, []);

  const handlePreview = async () => {
    if (!user?.accessToken) return;
    try {
      if (previewing) {
        await pauseTrack();
        setPreviewing(false);
        return;
      }
      await initSpotifyPlayer(user.accessToken);
      await playTrack(`spotify:track:${track.spotifyId}`, user.accessToken, startSec * 1000);
      setPreviewing(true);
      setTimeout(async () => {
        await pauseTrack();
        setPreviewing(false);
      }, 30000);
    } catch (err: any) {
      if (err.message?.includes('Premium') || err.message?.includes('NOT_PREMIUM')) {
        setPremiumError(true);
      } else {
        console.error('Preview error:', err);
      }
    }
  };

  const handleGenerate = async () => {
    if (!track) return;
    setSending(true);
    setError('');
    try {
      const result = await api.createVibe({
        trackId: track.spotifyId,
        mode,
        startSec: mode === 'PICK' ? startSec : undefined,
      });
      setVibeId(result.vibeId);
      setSent(true);
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
    const displayName = senderName || user?.displayName || 'Someone';
    openSms(displayName, vibeId, window.location.origin);
  };

  const handleCopy = async () => {
    const displayName = senderName || user?.displayName || 'Someone';
    await copyLink(displayName, vibeId, window.location.origin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestReceiver = () => {
    window.open(`${window.location.origin}/v/${vibeId}`, '_blank');
  };

  if (!track) {
    return (
      <div className="max-w-md mx-auto px-5 py-8">
        <p className="text-muted">No track selected.</p>
        <button onClick={() => navigate('/send')} className="text-gold text-sm mt-2 font-semibold">← Back to search</button>
      </div>
    );
  }

  // Que'd confirmation screen (after generating link)
  if (sent) {
    return (
      <div className="max-w-md mx-auto px-5 py-8 flex flex-col items-center min-h-screen">
        <div className="w-full flex items-center mb-8">
          <button onClick={() => navigate('/')} className="text-muted text-lg">←</button>
        </div>

        <h1 className="text-5xl font-extrabold text-ink tracking-tight mb-2">
          Que'd<span className="text-gold">.</span>
        </h1>
        <p className="text-muted text-sm mb-8">Send this blind clip.</p>

        {/* Album art with checkmark */}
        <div className="relative mb-10">
          <img
            src={track.albumArt}
            alt=""
            className="w-48 h-48 rounded-3xl object-cover shadow-card-hover border-4 border-white"
            style={{ transform: 'rotate(-3deg)' }}
          />
          <div className="absolute -bottom-3 -right-3 w-12 h-12 rounded-full bg-ink border-4 border-white flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
              <path d="M3 8L6.5 11.5L13 5" stroke="#F5A623" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        <div className="flex-1" />

        {/* Test Receiver View */}
        <button
          onClick={handleTestReceiver}
          className="btn-gold w-full flex items-center justify-center gap-2 mb-3"
        >
          <span>👁</span> Test Receiver View
        </button>

        {/* SMS + Copy buttons */}
        <div className="flex gap-3 w-full mb-4">
          <button
            onClick={handleSms}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
            SMS
          </button>
          <button
            onClick={handleCopy}
            className="flex-1 card p-3.5 font-bold text-ink flex items-center justify-center gap-2 hover:shadow-card-hover transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        {/* Start over */}
        <button
          onClick={() => navigate('/send')}
          className="text-xs font-bold text-muted uppercase tracking-wider py-3"
        >
          Start Over
        </button>
      </div>
    );
  }

  // Track selection + clip picker screen
  return (
    <div className="max-w-md mx-auto px-5 py-8 space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-muted text-lg">←</button>
        <button
          onClick={() => navigate('/send')}
          className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center text-muted text-sm"
        >
          ✕
        </button>
      </div>

      {/* Song confirmation */}
      <div className="card p-5 flex items-center gap-4">
        <img src={track.albumArt} alt="" className="w-14 h-14 rounded-xl object-cover" />
        <div className="flex-1 min-w-0">
          <div className="font-bold text-ink truncate">{track.title}</div>
          <div className="text-muted text-sm truncate">{track.artist} · {track.albumName}</div>
          <div className="text-muted text-xs">{formatDuration(track.duration)}</div>
        </div>
      </div>

      {/* Mode toggle */}
      <ModeToggle mode={mode} onModeChange={setMode} hasPreview={track.hasPreview} />

      {/* Auto mode callout */}
      {mode === 'AUTO' && (
        <div className="card p-4 border-mint/30">
          <p className="text-sm text-ink">
            <span className="font-semibold text-mint">Auto mode</span> — Spotify picks the best
            30-second preview clip (usually the chorus).
          </p>
        </div>
      )}

      {/* Pick mode waveform */}
      {mode === 'PICK' && (
        <div className="space-y-4">
          <WaveformPicker durationMs={track.duration} onWindowChange={handleWindowChange} />

          <button
            onClick={handlePreview}
            className="w-full card p-3 text-center text-sm font-semibold text-gold hover:bg-gold/5 transition-colors"
          >
            {previewing ? '⏸ Pause preview' : `▶ Preview ${formatTime(startSec)}–${formatTime(startSec + 30)}`}
          </button>

          {premiumError && (
            <div className="card p-4 border-gold/30">
              <p className="text-sm text-ink">
                <span className="font-semibold text-gold">Spotify Premium needed to preview.</span>{' '}
                Your friend will still hear the clip!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Recipient name input */}
      <div className="relative">
        <input
          type="text"
          value={recipientName}
          onChange={(e) => setRecipientName(e.target.value)}
          placeholder="Recipient name (optional)"
          className="w-full px-4 py-3 rounded-card border-2 border-gold/30 bg-white text-ink placeholder:text-muted text-center font-medium focus:outline-none focus:border-gold"
        />
        <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-sky" />
      </div>

      {error && (
        <div className="card p-4 border-coral/30">
          <p className="text-sm text-coral">{error}</p>
        </div>
      )}

      {/* Generate CTA */}
      <button
        onClick={handleGenerate}
        disabled={sending}
        className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {sending ? <div className="spinner" /> : (
          <>Generate Mystery Link ✦</>
        )}
      </button>
    </div>
  );
}
