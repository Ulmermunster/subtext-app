import { useState, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Wordmark from '../components/Wordmark';
import ModeToggle from '../components/ModeToggle';
import WaveformPicker from '../components/WaveformPicker';
import { api } from '../lib/api';
import { openSms } from '../lib/sms';
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
  const [mode, setMode] = useState<'AUTO' | 'PICK'>(track?.hasPreview ? 'AUTO' : 'PICK');
  const [startSec, setStartSec] = useState(0);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [previewing, setPreviewing] = useState(false);
  const [premiumError, setPremiumError] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    api.getMe().then(setUser).catch(() => {});
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
      // Stop after 30 seconds
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

  const handleSend = async () => {
    if (!track) return;
    setSending(true);
    setError('');
    try {
      const result = await api.createVibe({
        trackId: track.spotifyId,
        mode,
        startSec: mode === 'PICK' ? startSec : undefined,
      });
      const displayName = user?.displayName || 'Someone';
      openSms(displayName, result.vibeId, window.location.origin);
      setSent(true);
    } catch (err: any) {
      if (err.body?.error === 'no_preview') {
        setError(err.body.message);
      } else {
        setError(err.message || 'Failed to create vibe');
      }
    } finally {
      setSending(false);
    }
  };

  if (!track) {
    return (
      <div className="max-w-md mx-auto px-5 py-8">
        <p className="text-muted">No track selected.</p>
        <button onClick={() => navigate('/send')} className="text-violet text-sm mt-2">← Back to search</button>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="max-w-md mx-auto px-5 py-8 space-y-6 text-center">
        <Wordmark />
        <div className="card p-8 space-y-4">
          <div className="text-5xl">🎵</div>
          <h2 className="text-xl font-bold text-ink">Vibe sent!</h2>
          <p className="text-muted text-sm">
            {user?.displayName || 'Your friend'} will hear it blind.
          </p>
        </div>
        <button onClick={() => navigate('/send')} className="btn-primary w-full">
          Send another
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-5 py-8 space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-muted text-lg">←</button>
        <Wordmark size="sm" />
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
        <div className="card p-4 border-mint/30 bg-mint/5">
          <p className="text-sm text-ink">
            <span className="font-semibold text-mint">✓ Auto mode</span> — Spotify picks the best
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
            className="w-full card p-3 text-center text-sm font-semibold text-violet hover:bg-violet/5 transition-colors"
          >
            {previewing ? '⏸ Pause preview' : `▶ Preview ${formatTime(startSec)}–${formatTime(startSec + 30)}`}
          </button>

          {premiumError && (
            <div className="card p-4 border-amber/30 bg-amber/5">
              <p className="text-sm text-ink">
                <span className="font-semibold text-amber">⚠ Spotify Premium needed to preview.</span>{' '}
                Your friend will still hear the clip!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Lock callout */}
      <div className="card p-4 border-amber/30 bg-amber/5">
        <p className="text-sm text-ink">
          🔒 Artist & title stay hidden — reveal only unlocks when the clip ends
        </p>
      </div>

      {error && (
        <div className="card p-4 border-coral/30 bg-coral/5">
          <p className="text-sm text-coral">{error}</p>
        </div>
      )}

      {/* Send CTA */}
      <button
        onClick={handleSend}
        disabled={sending}
        className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {sending ? <div className="spinner" /> : '💬 Text a friend'}
      </button>
    </div>
  );
}

