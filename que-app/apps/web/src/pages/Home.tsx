import { useNavigate } from 'react-router-dom';
import { hapticTap } from '../lib/haptics';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div
      className="w-full relative overflow-hidden"
      style={{
        minHeight: '100dvh',
      }}
    >
      {/* ── Top App Bar ── */}
      <header
        className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-4"
        style={{
          background: 'rgba(245,246,252,0.6)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          paddingTop: 'max(1rem, env(safe-area-inset-top))',
        }}
      >
        <div className="flex items-center gap-3">
          {/* Avatar placeholder — tinted circle */}
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-container bg-gradient-to-br from-primary/20 to-primary-container/30 flex items-center justify-center">
            <span className="text-primary text-sm font-bold">Q</span>
          </div>
          <span className="text-2xl font-black text-primary tracking-tighter font-headline">
            Que<span className="text-primary-container">.</span>
          </span>
        </div>
{/* spacer to balance header layout */}
        <div className="w-10" />
      </header>

      {/* ── Main Content ── */}
      <main className="relative h-screen flex flex-col items-center justify-center px-6 pt-20 pb-32">
        {/* Pulse background blob */}
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
          <div className="pulse-bg w-[120%] h-[60%] rounded-full animate-pulse" />
        </div>

        {/* Hero Section */}
        <section className="relative z-10 w-full text-center mb-12">
          <h1 className="font-headline font-extrabold text-4xl text-ink tracking-tight mb-2">
            Tasting Room
          </h1>
          <p className="text-muted font-medium text-sm">
            Discover your next favorite melody.
          </p>
        </section>

        {/* ── Central Glass Card with Dice (clickable) ── */}
        <button
          onPointerDown={hapticTap}
          onClick={() => navigate('/send')}
          className="relative z-10 w-full max-w-sm aspect-square glass-card flex items-center justify-center mb-8 cursor-pointer active:scale-[0.97] transition-transform duration-200 group"
          aria-label="Roll the dice"
        >
          {/* Pulsing glow ring behind dice */}
          <div className="absolute inset-0 rounded-card dice-pulse-glow pointer-events-none" />

          <div className="relative w-full h-full flex items-center justify-center gap-4">
            {/* Magenta Die */}
            <div className="w-28 h-28 bg-gradient-to-br from-primary to-primary-container rounded-lg shadow-xl transform -rotate-12 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
              <div className="grid grid-cols-2 gap-3 p-4">
                <div className="w-3 h-3 bg-white rounded-full" />
                <div className="w-3 h-3 bg-white rounded-full" />
                <div className="w-3 h-3 bg-white rounded-full" />
                <div className="w-3 h-3 bg-white rounded-full" />
              </div>
            </div>
            {/* Cyan Die */}
            <div className="w-28 h-28 bg-gradient-to-br from-secondary to-secondary-container rounded-lg shadow-xl transform rotate-12 -translate-y-4 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
              <div className="grid grid-cols-3 gap-2 p-4">
                <div className="w-2 h-2 bg-white rounded-full" />
                <div className="w-2 h-2 bg-white rounded-full" />
                <div className="w-2 h-2 bg-white rounded-full" />
                <div className="w-2 h-2 bg-white rounded-full" />
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
            </div>
          </div>
        </button>

        {/* Tap hint */}
        <p className="relative z-10 text-muted text-xs font-medium tracking-wide uppercase opacity-60">
          Tap the dice to roll
        </p>
      </main>

      {/* ── Bottom Nav Bar ── */}
      <nav
        className="fixed bottom-0 w-full z-50 flex justify-around items-center px-4 pt-4 rounded-t-xl"
        style={{
          background: 'rgba(239,240,247,0.6)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          boxShadow: '0 -12px 32px rgba(156,56,83,0.08)',
          paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
        }}
      >
        {/* Active: ROLL */}
        <button
          onClick={() => navigate('/')}
          className="flex flex-col items-center justify-center bg-gradient-to-br from-primary to-primary-container text-white rounded-full px-6 py-2 active:scale-95 transition-all duration-200"
        >
          <span className="text-xl">🎲</span>
          <span className="text-[10px] uppercase tracking-widest font-bold mt-0.5 font-body">ROLL</span>
        </button>

        {/* MYSTERY — create a mystery link */}
        <button
          onClick={() => navigate('/send')}
          className="flex flex-col items-center justify-center text-muted opacity-60 hover:scale-105 transition-transform"
        >
          <span className="text-xl">❓</span>
          <span className="text-[10px] uppercase tracking-widest font-bold mt-0.5 font-body">MYSTERY</span>
        </button>

        {/* GUESS */}
        <button
          onClick={() => navigate('/send', { state: { defaultGameMode: 'guess' } })}
          className="flex flex-col items-center justify-center text-muted opacity-60 hover:scale-105 transition-transform"
        >
          <span className="text-xl">🧠</span>
          <span className="text-[10px] uppercase tracking-widest font-bold mt-0.5 font-body">GUESS</span>
        </button>

        {/* COLLECTION */}
        <button
          onClick={() => navigate('/queue')}
          className="flex flex-col items-center justify-center text-muted opacity-60 hover:scale-105 transition-transform"
        >
          <span className="text-xl">📦</span>
          <span className="text-[10px] uppercase tracking-widest font-bold mt-0.5 font-body">COLLECTION</span>
        </button>
      </nav>
    </div>
  );
}
