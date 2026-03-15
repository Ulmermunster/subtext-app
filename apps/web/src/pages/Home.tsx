import { Link } from 'react-router-dom';
import Wordmark from '../components/Wordmark';

const STEPS = [
  { icon: '🎧', label: 'PICK', number: 1 },
  { icon: '📨', label: 'SEND', number: 2 },
  { icon: '🙈', label: 'BLIND', number: 3 },
  { icon: '✨', label: 'REVEAL', number: null },
];

export default function Home() {
  return (
    <div className="max-w-md mx-auto px-5 py-8 flex flex-col items-center min-h-screen">
      {/* Back arrow placeholder */}
      <div className="w-full flex items-center mb-8">
        <div className="w-8" />
      </div>

      {/* Wordmark */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold text-ink tracking-tight">
          Que<span className="text-gold">.</span>
        </h1>
        <p className="text-xs font-semibold text-muted uppercase tracking-[0.2em] mt-1">
          The Blind Taste Test
        </p>
      </div>

      {/* Q Logo Orb */}
      <div className="relative mb-16">
        {/* Outer glow ring */}
        <div className="absolute inset-[-20px] rounded-full bg-gold/10" />
        {/* White border ring */}
        <div className="absolute inset-[-4px] rounded-full bg-white shadow-glow" />
        {/* Gold gradient orb */}
        <div className="relative w-48 h-48 rounded-full bg-gradient-to-br from-gold to-gold-light flex items-center justify-center">
          {/* Sparkle icon */}
          <span className="absolute -top-1 -right-1 text-gold text-2xl">✦</span>
          {/* Q letter */}
          <span className="text-7xl font-extrabold text-ink/80">Q</span>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Step indicators at bottom */}
      <div className="w-full card p-4 mb-6">
        <div className="flex items-center justify-between">
          {STEPS.map((step, i) => (
            <div key={step.label} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-10 h-10 rounded-full bg-gold flex items-center justify-center text-lg">
                  {step.icon}
                </div>
                <span className="text-[10px] font-bold text-ink uppercase tracking-wider">
                  {step.number ? `${step.number}. ` : ''}{step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="w-6 h-0.5 bg-gold/30 mx-1 mt-[-14px]" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <Link
        to="/send"
        className="btn-primary block text-center w-full"
      >
        Que a Song +
      </Link>
    </div>
  );
}
