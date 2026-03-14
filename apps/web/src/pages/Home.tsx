import { Link } from 'react-router-dom';
import Wordmark from '../components/Wordmark';

const DEMO_VIBES = [
  { id: '1', sender: 'Maya', color: '#7C3AED' },
  { id: '2', sender: 'Jordan', color: '#3B82F6' },
  { id: '3', sender: 'Alex', color: '#F97316' },
];

export default function Home() {
  return (
    <div className="max-w-md mx-auto px-5 py-8 space-y-8">
      <header className="flex items-center justify-between">
        <Wordmark />
      </header>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-ink">Your vibes 🎵</h2>
          <p className="text-muted text-sm mt-1">Listen first. Judge never.</p>
        </div>

        <div className="space-y-3">
          {DEMO_VIBES.map((vibe) => (
            <div
              key={vibe.id}
              className="card p-4 flex items-center gap-4"
              style={{ borderLeft: `4px solid ${vibe.color}` }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                style={{ background: vibe.color }}
              >
                {vibe.sender[0]}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-ink text-sm">From {vibe.sender}</div>
                <div className="text-muted text-xs">Tap to listen blind 🎧</div>
              </div>
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: vibe.color }} />
            </div>
          ))}
        </div>
      </section>

      <Link
        to="/send"
        className="btn-primary block text-center w-full"
      >
        Send a Vibe +
      </Link>
    </div>
  );
}
