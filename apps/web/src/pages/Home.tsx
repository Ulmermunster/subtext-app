import { useNavigate } from 'react-router-dom';
import { hapticTap } from '../lib/haptics';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div
      className="w-full max-w-md mx-auto px-5 flex flex-col items-center justify-center"
      style={{
        minHeight: '100dvh',
        paddingTop: 'max(1.5rem, env(safe-area-inset-top))',
        paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
      }}
    >
      {/* Queue button — top right */}
      <button
        onClick={() => navigate('/queue')}
        className="absolute top-0 right-0 mt-[max(1.25rem,env(safe-area-inset-top))] mr-5 w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center text-muted active:scale-95 transition-transform shadow-card"
        aria-label="Queue history"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
      </button>

      {/* Wordmark */}
      <div className="text-center mb-4">
        <h1 className="text-4xl font-extrabold text-ink tracking-tight">
          Que<span className="text-gold">.</span>
        </h1>
        <p className="text-[11px] font-semibold text-muted uppercase tracking-[0.25em] mt-1">
          The Blind Taste Test
        </p>
      </div>

      {/* Pulsing Q Orb — main CTA */}
      <button
        onPointerDown={hapticTap}
        onClick={() => navigate('/send')}
        className="relative group my-8 focus:outline-none"
        aria-label="Send a Que"
      >
        {/* Pulse rings */}
        <span className="absolute inset-[-24px] rounded-full border-[1.5px] border-gold/20 animate-orb-ping" />
        <span className="absolute inset-[-40px] rounded-full border border-gold/10 animate-orb-ping animation-delay-400" />

        {/* Outer glow */}
        <span className="absolute inset-[-6px] rounded-full bg-gradient-to-br from-gold/15 to-gold-light/10 blur-sm group-active:scale-95 transition-transform" />

        {/* White ring */}
        <span className="absolute inset-[-4px] rounded-full bg-white shadow-glow" />

        {/* Gold orb */}
        <span className="relative flex items-center justify-center w-44 h-44 rounded-full bg-gradient-to-br from-gold to-gold-light shadow-glow group-hover:shadow-[0_0_80px_rgba(245,166,35,.35)] group-active:scale-[0.96] transition-all duration-200">
          {/* Sparkle */}
          <span className="absolute -top-1 -right-1 text-gold text-xl opacity-80">✦</span>
          {/* Q */}
          <span className="text-7xl font-extrabold text-ink/80 select-none">Q</span>
        </span>
      </button>

      {/* Hint text */}
      <p className="text-xs font-medium text-muted mb-10 animate-fade-in">
        tap to send a song
      </p>

      {/* How it works — compact step pills */}
      <div className="w-full max-w-xs">
        <div className="flex items-center justify-between gap-1">
          <StepPill emoji="🎧" label="Pick" />
          <Dot />
          <StepPill emoji="📨" label="Send" />
          <Dot />
          <StepPill emoji="🙈" label="Blind" />
          <Dot />
          <StepPill emoji="✨" label="Reveal" />
        </div>
      </div>
    </div>
  );
}

function StepPill({ emoji, label }: { emoji: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="w-9 h-9 rounded-full bg-gold/10 flex items-center justify-center text-sm">
        {emoji}
      </span>
      <span className="text-[9px] font-bold text-muted uppercase tracking-wider">{label}</span>
    </div>
  );
}

function Dot() {
  return <span className="w-1 h-1 rounded-full bg-gold/30 mb-4" />;
}
