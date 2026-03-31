import { useState, useEffect } from 'react';

const API = '';

interface Stats {
  overview: {
    totalVibes: number;
    totalPlayed: number;
    totalReacted: number;
    totalRevealed: number;
    uniqueSenders: number;
    todayVibes: number;
    weekVibes: number;
  };
  modes: { pick: number; auto: number };
  reactions: { vibe: number; nope: number };
  funnel: { playRate: number; reactRate: number; revealRate: number; vibeRate: number };
  dailyVolume: Array<{ date: string; count: number }>;
  topSenders: Array<{ name: string; count: number }>;
  topTracks: Array<{ title: string; artist: string; count: number }>;
  locations: Array<{ city: string; country: string; count: number }>;
  recentVibes: Array<{
    id: string;
    track: string;
    mode: string;
    sender: string;
    senderLocation: string | null;
    receiverLocation: string | null;
    createdAt: string;
    played: boolean;
    reaction: string | null;
    revealed: boolean;
  }>;
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="glass-card p-5">
      <p className="text-muted text-xs font-medium uppercase tracking-wide font-body">{label}</p>
      <p className="text-ink text-2xl font-bold mt-1 font-headline">{value}</p>
      {sub && <p className="text-muted text-xs mt-1 font-body">{sub}</p>}
    </div>
  );
}

function FunnelBar({ label, pct }: { label: string; pct: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted w-20 text-right font-body">{label}</span>
      <div className="flex-1 bg-white/15 rounded-full h-5 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-primary-container rounded-full transition-all duration-500"
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-ink w-10 font-headline">{pct}%</span>
    </div>
  );
}

export default function Admin() {
  const [secret, setSecret] = useState('');
  const [authed, setAuthed] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check URL param for secret
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get('secret');
    if (s) {
      setSecret(s);
      fetchStats(s);
    }
  }, []);

  async function fetchStats(s?: string) {
    const key = s || secret;
    if (!key) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/admin/stats`, {
        headers: { 'x-admin-secret': key },
      });
      if (!res.ok) {
        setError(res.status === 401 ? 'Invalid admin secret' : 'Failed to load stats');
        return;
      }
      const data = await res.json();
      setStats(data);
      setAuthed(true);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  if (!authed) {
    return (
      <div className="mesh-gradient min-h-screen flex items-center justify-center p-4">
        <div className="glass-card p-8 w-full max-w-sm">
          <h1 className="text-primary font-black italic text-2xl mb-1 font-headline tracking-tighter">
            Que<span className="text-primary-container">.</span> admin
          </h1>
          <p className="text-muted text-sm mb-6 font-body">Enter admin secret to view dashboard</p>
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchStats()}
            placeholder="Admin secret"
            className="w-full border-2 border-primary/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary mb-3 bg-white/30 backdrop-blur-md font-body"
          />
          {error && <p className="text-error text-sm mb-3 font-body">{error}</p>}
          <button
            onClick={() => fetchStats()}
            disabled={loading || !secret}
            className="btn-primary w-full disabled:opacity-50 transition"
          >
            {loading ? 'Loading...' : 'View Dashboard'}
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const maxDaily = Math.max(...stats.dailyVolume.map((d) => d.count), 1);

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-primary font-black italic text-2xl font-headline tracking-tighter">
            Que<span className="text-primary-container">.</span> admin
          </h1>
          <p className="text-muted text-sm font-body">Dashboard &amp; analytics</p>
        </div>
        <button
          onClick={() => fetchStats()}
          className="glass-card text-ink text-sm font-medium px-4 py-2 hover:shadow-card-hover transition active:scale-95"
        >
          Refresh
        </button>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatCard label="Total Vibes" value={stats.overview.totalVibes} />
        <StatCard label="Played" value={stats.overview.totalPlayed} sub={`${stats.funnel.playRate}% of sent`} />
        <StatCard label="Reacted" value={stats.overview.totalReacted} sub={`${stats.funnel.reactRate}% of played`} />
        <StatCard label="Revealed" value={stats.overview.totalRevealed} sub={`${stats.funnel.revealRate}% of reacted`} />
        <StatCard label="Unique Senders" value={stats.overview.uniqueSenders} />
        <StatCard label="Today" value={stats.overview.todayVibes} />
        <StatCard label="This Week" value={stats.overview.weekVibes} />
        <StatCard label="Vibe Rate" value={`${stats.funnel.vibeRate}%`} sub="of reactions" />
      </div>

      {/* Funnel + Modes/Reactions */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <div className="glass-card p-5">
          <h2 className="text-ink font-semibold text-sm mb-4 font-headline">Completion Funnel</h2>
          <div className="space-y-3">
            <FunnelBar label="Played" pct={stats.funnel.playRate} />
            <FunnelBar label="Reacted" pct={stats.funnel.reactRate} />
            <FunnelBar label="Revealed" pct={stats.funnel.revealRate} />
          </div>
        </div>

        <div className="glass-card p-5">
          <h2 className="text-ink font-semibold text-sm mb-4 font-headline">Breakdown</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-muted text-xs font-medium uppercase mb-2 font-body">Modes</p>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-3 h-3 rounded-full bg-gradient-to-br from-primary to-primary-container" />
                <span className="text-sm text-ink font-body">Auto: {stats.modes.auto}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-secondary-container" />
                <span className="text-sm text-ink font-body">Pick: {stats.modes.pick}</span>
              </div>
            </div>
            <div>
              <p className="text-muted text-xs font-medium uppercase mb-2 font-body">Reactions</p>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-3 h-3 rounded-full bg-[#00CCCC]" />
                <span className="text-sm text-ink font-body">Vibe: {stats.reactions.vibe}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary-container" />
                <span className="text-sm text-ink font-body">Nope: {stats.reactions.nope}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Volume Chart */}
      {stats.dailyVolume.length > 0 && (
        <div className="glass-card p-5 mb-8">
          <h2 className="text-ink font-semibold text-sm mb-4 font-headline">Daily Volume (14 days)</h2>
          <div className="flex items-end gap-1 h-32">
            {stats.dailyVolume.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-muted font-body">{d.count}</span>
                <div
                  className="w-full bg-gradient-to-t from-primary to-primary-container rounded-t-sm min-h-[4px] transition-all"
                  style={{ height: `${(d.count / maxDaily) * 100}%` }}
                />
                <span className="text-[9px] text-muted font-body">{d.date.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Senders + Top Tracks + Locations */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="glass-card p-5">
          <h2 className="text-ink font-semibold text-sm mb-3 font-headline">Top Senders</h2>
          {stats.topSenders.map((s, i) => (
            <div key={i} className="flex justify-between py-1.5 border-b border-white/20 last:border-0">
              <span className="text-sm text-ink truncate font-body">{s.name}</span>
              <span className="text-sm font-semibold text-primary ml-2 font-headline">{s.count}</span>
            </div>
          ))}
          {stats.topSenders.length === 0 && <p className="text-muted text-sm font-body">No data yet</p>}
        </div>

        <div className="glass-card p-5">
          <h2 className="text-ink font-semibold text-sm mb-3 font-headline">Top Tracks</h2>
          {stats.topTracks.map((t, i) => (
            <div key={i} className="py-1.5 border-b border-white/20 last:border-0">
              <p className="text-sm text-ink truncate font-body">{t.title}</p>
              <p className="text-xs text-muted truncate font-body">{t.artist} &middot; {t.count} sends</p>
            </div>
          ))}
          {stats.topTracks.length === 0 && <p className="text-muted text-sm font-body">No data yet</p>}
        </div>

        <div className="glass-card p-5">
          <h2 className="text-ink font-semibold text-sm mb-3 font-headline">Locations</h2>
          {stats.locations.map((l, i) => (
            <div key={i} className="flex justify-between py-1.5 border-b border-white/20 last:border-0">
              <span className="text-sm text-ink truncate font-body">{l.city}, {l.country}</span>
              <span className="text-sm font-semibold text-primary ml-2 font-headline">{l.count}</span>
            </div>
          ))}
          {stats.locations.length === 0 && <p className="text-muted text-sm font-body">No data yet</p>}
        </div>
      </div>

      {/* Recent Vibes Table */}
      <div className="glass-card p-5 mb-8 overflow-x-auto">
        <h2 className="text-ink font-semibold text-sm mb-4 font-headline">Recent Vibes</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted text-xs uppercase border-b border-white/20 font-body">
              <th className="pb-2 pr-3">ID</th>
              <th className="pb-2 pr-3">Track</th>
              <th className="pb-2 pr-3">Sender</th>
              <th className="pb-2 pr-3">From</th>
              <th className="pb-2 pr-3">To</th>
              <th className="pb-2 pr-3">Mode</th>
              <th className="pb-2 pr-3">Status</th>
              <th className="pb-2">Time</th>
            </tr>
          </thead>
          <tbody className="font-body">
            {stats.recentVibes.map((v) => (
              <tr key={v.id} className="border-b border-white/10 last:border-0">
                <td className="py-2 pr-3 font-mono text-xs text-muted">{v.id}</td>
                <td className="py-2 pr-3 truncate max-w-[200px]">{v.track}</td>
                <td className="py-2 pr-3 truncate">{v.sender}</td>
                <td className="py-2 pr-3 text-xs text-muted">{v.senderLocation || '—'}</td>
                <td className="py-2 pr-3 text-xs text-muted">{v.receiverLocation || '—'}</td>
                <td className="py-2 pr-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${v.mode === 'PICK' ? 'bg-secondary-container/30 text-secondary' : 'bg-primary-container/20 text-primary'}`}>
                    {v.mode}
                  </span>
                </td>
                <td className="py-2 pr-3">
                  {v.reaction ? (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${v.reaction === 'VIBE' ? 'bg-[#00CCCC]/10 text-[#00CCCC]' : 'bg-primary-container/20 text-primary'}`}>
                      {v.reaction}
                    </span>
                  ) : v.played ? (
                    <span className="text-xs text-muted">Played</span>
                  ) : (
                    <span className="text-xs text-muted">Sent</span>
                  )}
                </td>
                <td className="py-2 text-xs text-muted whitespace-nowrap">
                  {new Date(v.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}{' '}
                  {new Date(v.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {stats.recentVibes.length === 0 && <p className="text-muted text-sm text-center py-4 font-body">No vibes yet</p>}
      </div>
    </div>
  );
}
