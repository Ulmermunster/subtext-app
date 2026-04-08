import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import BottomNav from '../components/BottomNav';

interface QueItem {
  id: string;
  trackTitle: string;
  trackArtist: string;
  albumName: string;
  albumArt: string;
  spotifyId: string;
  senderDisplayName: string;
  reaction: string | null;
  createdAt: string;
  playedAt: string | null;
  revealedAt: string | null;
  streak: number;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function ReactionBadge({ reaction }: { reaction: string | null }) {
  if (reaction === 'VIBE') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#00CCCC]/15 text-[#00CCCC]">
        👍 Vibe
      </span>
    );
  }
  if (reaction === 'NOPE') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-primary-container/15 text-primary">
        👎 Nope
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-tertiary-container/30 text-tertiary">
      ⏳ Unplayed
    </span>
  );
}

function QueCard({ item, isSent }: { item: QueItem; isSent: boolean }) {
  return (
    <div className="glass-card p-4 flex items-center gap-3 mb-3">
      <img
        src={item.albumArt}
        alt=""
        loading="lazy"
        className="w-14 h-14 rounded-xl object-cover flex-shrink-0 shadow-sm"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-sm text-ink truncate font-headline">{item.trackTitle}</span>
          {item.streak > 1 && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary-container/15 text-primary flex-shrink-0">
              🔥 {item.streak}
            </span>
          )}
        </div>
        <div className="text-xs text-muted truncate font-body">{item.trackArtist}</div>
        <div className="flex items-center gap-2 mt-1.5">
          <ReactionBadge reaction={item.reaction} />
          <span className="text-[10px] text-muted font-body">{timeAgo(item.createdAt)}</span>
        </div>
      </div>
      {isSent && (
        <div className="flex-shrink-0 text-right">
          <div className="text-[10px] text-muted font-medium font-body">
            {item.playedAt ? 'Opened' : 'Pending'}
          </div>
        </div>
      )}
    </div>
  );
}

export default function History() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'sent' | 'received'>('sent');
  const [sent, setSent] = useState<QueItem[]>([]);
  const [received, setReceived] = useState<QueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getHistory()
      .then((data) => {
        setSent(data.sent);
        setReceived(data.received);
      })
      .catch((err: any) => setError(err.message || 'Failed to load history'))
      .finally(() => setLoading(false));
  }, []);

  const items = tab === 'sent' ? sent : received;

  return (
    <div className="bg-surface font-body text-on-surface mesh-gradient min-h-screen flex flex-col">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-black/40 backdrop-blur-3xl border-b border-white/5">
        <div className="flex justify-between items-center px-6 h-16 w-full">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">music_note</span>
          </div>
          <h1 className="text-2xl font-black text-on-surface italic tracking-tight font-headline">Que.</h1>
          <div className="w-8" />
        </div>
      </header>

      <div className="flex-grow pt-20 pb-32 px-5 max-w-md mx-auto w-full flex flex-col">

      {/* Tabs */}
      <div className="flex gap-2 mt-2 mb-4">
        <button
          onClick={() => setTab('sent')}
          className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-all active:scale-[0.97] font-headline ${
            tab === 'sent'
              ? 'bg-gradient-to-br from-primary to-primary-container text-white shadow-card'
              : 'bg-white/20 backdrop-blur-md border border-white/30 text-muted'
          }`}
        >
          Sent{sent.length > 0 && ` (${sent.length})`}
        </button>
        <button
          onClick={() => setTab('received')}
          className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-all active:scale-[0.97] font-headline ${
            tab === 'received'
              ? 'bg-gradient-to-br from-primary to-primary-container text-white shadow-card'
              : 'bg-white/20 backdrop-blur-md border border-white/30 text-muted'
          }`}
        >
          Received{received.length > 0 && ` (${received.length})`}
        </button>
      </div>

      {/* Content */}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="spinner" />
        </div>
      )}

      {error && (
        <div className="glass-card p-4 border-error/30 text-center">
          <p className="text-sm text-error font-body">{error}</p>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <span className="text-4xl">{tab === 'sent' ? '🎵' : '📬'}</span>
          <p className="text-sm text-muted font-medium font-body">
            {tab === 'sent'
              ? "No Que's sent yet"
              : "No Que's received yet"}
          </p>
          {tab === 'sent' && (
            <button
              onClick={() => navigate('/send')}
              className="btn-primary text-sm px-6 py-3 mt-2"
            >
              Send your first Que
            </button>
          )}
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="flex-1">
          {items.map((item) => (
            <QueCard key={item.id} item={item} isSent={tab === 'sent'} />
          ))}
        </div>
      )}
      </div>

      <BottomNav active="collection" />
    </div>
  );
}
