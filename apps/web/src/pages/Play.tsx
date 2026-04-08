import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { hapticTap } from '../lib/haptics';

export default function Play() {
  const navigate = useNavigate();

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

      {/* Main */}
      <main className="flex-grow pt-24 pb-32 px-6 flex flex-col items-center justify-center max-w-lg mx-auto w-full gap-5">
        <div className="text-center mb-4">
          <h2 className="text-3xl font-black italic tracking-tighter text-white font-headline">Play</h2>
          <p className="text-sm text-white/40 font-medium mt-1">No sending. Just vibes.</p>
        </div>

        {/* Discover Card */}
        <button
          onPointerDown={hapticTap}
          onClick={() => navigate('/play/discover')}
          className="w-full glass-card p-6 flex items-center gap-5 text-left active:scale-[0.98] transition-all duration-200 cursor-pointer group"
        >
          <div className="w-14 h-14 rounded-2xl tropical-gradient flex items-center justify-center flex-shrink-0 shadow-lg shadow-pink-500/20 group-active:scale-95 transition-transform">
            <span className="material-symbols-outlined text-white text-2xl">casino</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-black uppercase tracking-tight text-white font-headline">Discover</h3>
            <p className="text-xs text-white/40 mt-0.5 font-body">Roll the dice. Find new music for yourself.</p>
          </div>
          <span className="material-symbols-outlined text-white/20 text-xl">chevron_right</span>
        </button>

        {/* Guess the Artist Card */}
        <button
          onPointerDown={hapticTap}
          onClick={() => navigate('/play/guess')}
          className="w-full glass-card p-6 flex items-center gap-5 text-left active:scale-[0.98] transition-all duration-200 cursor-pointer group"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/20 group-active:scale-95 transition-transform">
            <span className="material-symbols-outlined text-white text-2xl">target</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-black uppercase tracking-tight text-white font-headline">Guess the Artist</h3>
            <p className="text-xs text-white/40 mt-0.5 font-body">How well do you know music? Play solo or with friends.</p>
          </div>
          <span className="material-symbols-outlined text-white/20 text-xl">chevron_right</span>
        </button>
      </main>

      <BottomNav active="play" />
    </div>
  );
}
