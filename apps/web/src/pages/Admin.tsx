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
    <div className="bg-white rounded-card p-5 shadow-card">
      <p className="text-muted text-xs font-medium uppercase tracking-wide">{label}</p>
      <p className="text-ink text-2xl font-bold mt-1">{value}</p>
      {sub && <p className="text-muted text-xs mt-1">{sub}</p>}
    </div>
  );
}

function FunnelBar({ label, pct }: { label: string; pct: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted w-20 text-right">{label}</span>
      <div className="flex-1 bg-gold-pale rounded-full h-5 overflow-hidden">
        <div
          className="h-full bg-gold rounded-full transition-all duration-500"
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-ink w-10">{pct}%</span>
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
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-card shadow-card p-8 w-full max-w-sm">
          <h1 className="text-ink font-bold text-xl mb-1">que. admin</h1>
          <p className="text-muted text-sm mb-6">Enter admin secret to view dashboard</p>
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchStats()}
            placeholder="Admin secret"
            className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold mb-3"
          />
          {error && <p className="text-coral text-sm mb-3">{error}</p>}
          <button
            onClick={() => fetchStats()}
            disabled={loading || !secret}
            className="w-full bg-ink text-white font-semibold py-3 rounded-xl hover:opacity-90 disabled:opacity-50 transition"
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
          <h1 className="text-ink font-bold text-2xl">que. admin</h1>
          <p className="text-muted text-sm">Dashboard &amp; analytics</p>
        </div>
        <button
          onClick={() => fetchStats()}
          className="bg-white text-ink text-sm font-medium px-4 py-2 rounded-xl shadow-card hover:shadow-card-hover transition"
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
        <div className="bg-white rounded-card p-5 shadow-card">
          <h2 className="text-ink font-semibold text-sm mb-4">Completion Funnel</h2>
          <div className="space-y-3">
            <FunnelBar label="Played" pct={stats.funnel.playRate} />
            <FunnelBar label="Reacted" pct={stats.funnel.reactRate} />
            <FunnelBar label="Revealed" pct={stats.funnel.revealRate} />
          </div>
        </div>

        <div className="bg-white rounded-card p-5 shadow-card">
          <h2 className="text-ink font-semibold text-sm mb-4">Breakdown</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-muted text-xs font-medium uppercase mb-2">Modes</p>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-3 h-3 rounded-full bg-gold" />
                <span className="text-sm text-ink">Auto: {stats.modes.auto}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-sky" />
                <span className="text-sm text-ink">Pick: {stats.modes.pick}</span>
              </div>
            </div>
            <div>
              <p className="text-muted text-xs font-medium uppercase mb-2">Reactions</p>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-3 h-3 rounded-full bg-mint" />
                <span className="text-sm text-ink">Vibe: {stats.reactions.vibe}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-coral" />
                <span className="text-sm text-ink">Nope: {stats.reactions.nope}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Volume Chart */}
      {stats.dailyVolume.length > 0 && (
        <div className="bg-white rounded-card p-5 shadow-card mb-8">
          <h2 className="text-ink font-semibold text-sm mb-4">Daily Volume (14 days)</h2>
          <div className="flex items-end gap-1 h-32">
            {stats.dailyVolume.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-muted">{d.count}</span>
                <div
                  className="w-full bg-gold rounded-t-sm min-h-[4px] transition-all"
                  style={{ height: `${(d.count / maxDaily) * 100}%` }}
                />
                <span className="text-[9px] text-muted">{d.date.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Senders + Top Tracks + Locations */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-card p-5 shadow-card">
          <h2 className="text-ink font-semibold text-sm mb-3">Top Senders</h2>
          {stats.topSenders.map((s, i) => (
            <div key={i} className="flex justify-between py-1.5 border-b border-border last:border-0">
              <span className="text-sm text-ink truncate">{s.name}</span>
              <span className="text-sm font-semibold text-gold ml-2">{s.count}</span>
            </div>
          ))}
          {stats.topSenders.length === 0 && <p className="text-muted text-sm">No data yet</p>}
        </div>

        <div className="bg-white rounded-card p-5 shadow-card">
          <h2 className="text-ink font-semibold text-sm mb-3">Top Tracks</h2>
          {stats.topTracks.map((t, i) => (
            <div key={i} className="py-1.5 border-b border-border last:border-0">
              <p className="text-sm text-ink truncate">{t.title}</p>
              <p className="text-xs text-muted truncate">{t.artist} &middot; {t.count} sends</p>
            </div>
          ))}
          {stats.topTracks.length === 0 && <p className="text-muted text-sm">No data yet</p>}
        </div>

        <div className="bg-white rounded-card p-5 shadow-card">
          <h2 className="text-ink font-semibold text-sm mb-3">Locations</h2>
          {stats.locations.map((l, i) => (
            <div key={i} className="flex justify-between py-1.5 border-b border-border last:border-0">
              <span className="text-sm text-ink truncate">{l.city}, {l.country}</span>
              <span className="text-sm font-semibold text-gold ml-2">{l.count}</span>
            </div>
          ))}
          {stats.locations.length === 0 && <p className="text-muted text-sm">No data yet</p>}
        </div>
      </div>

      {/* Recent Vibes Table */}
      <div className="bg-white rounded-card p-5 shadow-card mb-8 overflow-x-auto">
        <h2 className="text-ink font-semibold text-sm mb-4">Recent Vibes</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted text-xs uppercase border-b border-border">
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
          <tbody>
            {stats.recentVibes.map((v) => (
              <tr key={v.id} className="border-b border-border last:border-0">
                <td className="py-2 pr-3 font-mono text-xs text-muted">{v.id}</td>
                <td className="py-2 pr-3 truncate max-w-[200px]">{v.track}</td>
                <td className="py-2 pr-3 truncate">{v.sender}</td>
                <td className="py-2 pr-3 text-xs text-muted">{v.senderLocation || '—'}</td>
                <td className="py-2 pr-3 text-xs text-muted">{v.receiverLocation || '—'}</td>
                <td className="py-2 pr-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${v.mode === 'PICK' ? 'bg-sky/10 text-sky' : 'bg-gold-pale text-gold'}`}>
                    {v.mode}
                  </span>
                </td>
                <td className="py-2 pr-3">
                  {v.reaction ? (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${v.reaction === 'VIBE' ? 'bg-mint/10 text-mint' : 'bg-coral/10 text-coral'}`}>
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
        {stats.recentVibes.length === 0 && <p className="text-muted text-sm text-center py-4">No vibes yet</p>}
      </div>
    </div>
  );
}
