import { useMemo } from 'react';

interface OrbVisualizerProps {
  playing: boolean;
  scale?: number;
  albumArt?: string;
  revealed?: boolean;
  /** Size variant — 'lg' for Discover, 'sm' for Guess */
  size?: 'lg' | 'sm';
}

/**
 * Frosted squircle visualizer with sunset audio bars.
 * Mirrors the Receiver.tsx orb design for visual consistency across all
 * blind-listen states.
 */
export default function OrbVisualizer({
  playing,
  scale = 1,
  albumArt,
  revealed = false,
  size = 'lg',
}: OrbVisualizerProps) {
  const bars = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        height: 20 + Math.random() * 30,
        delay: i * 0.08,
      })),
    [],
  );

  const isLg = size === 'lg';
  const wrapSize = isLg ? 'w-56 h-56 md:w-64 md:h-64' : 'w-40 h-40';
  const orbSize = isLg ? 'w-[220px] h-[220px]' : 'w-[152px] h-[152px]';
  const artSize = isLg ? 'w-20 h-20' : 'w-14 h-14';
  const noteSize = isLg ? 'text-3xl' : 'text-xl';
  const ringOuter = isLg ? 'w-[250px] h-[250px]' : 'w-[175px] h-[175px]';
  const ringInner = isLg ? 'w-[280px] h-[280px]' : 'w-[200px] h-[200px]';

  return (
    <div className={`relative ${wrapSize} flex items-center justify-center`}>
      {/* Pulsing rings */}
      {playing && (
        <>
          <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${ringOuter} rounded-[2.5rem] border-[1.5px] border-pink-500/25 animate-orb-ping z-0`}
          />
          <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${ringInner} rounded-[2.5rem] border-[1.5px] border-pink-500/25 animate-orb-ping animation-delay-400 z-0`}
          />
        </>
      )}

      {/* Orb — frosted squircle */}
      <div
        className={`orb-squircle ${orbSize} relative z-[2] flex items-center justify-center overflow-hidden`}
        style={{
          transform: playing ? `scale(${scale})` : undefined,
          transition: 'transform 80ms ease-out',
        }}
      >
        {/* Nebula morph core */}
        <div className="orb-nebula" />
        {/* Glass sheen */}
        <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-tr from-transparent via-white/10 to-white/20 z-[1]" />

        {/* Content layer */}
        <div className="relative z-[3] flex flex-col items-center">
          {albumArt && (
            <img
              src={albumArt}
              alt=""
              className={`${artSize} rounded-lg shadow-2xl mb-2 border border-white/20 object-cover transition-all duration-700 ${
                revealed ? 'blur-0 brightness-100' : 'blur-md brightness-75'
              }`}
            />
          )}
          <span
            className={`material-symbols-outlined text-[#FF6B9D] ${noteSize}`}
            style={{
              fontVariationSettings: "'FILL' 1",
              transform: playing ? `scale(${scale})` : undefined,
              transition: 'transform 80ms ease-out',
            }}
          >
            music_note
          </span>
        </div>

        {/* Sunset audio bars */}
        <div
          className={`absolute inset-0 flex items-center justify-center gap-[3px] z-[4] transition-opacity duration-400 ${
            playing ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {bars.map((bar, i) => (
            <div
              key={i}
              className="orb-bar-react"
              style={
                {
                  '--h': `${bar.height}px`,
                  animationDelay: `${bar.delay}s`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
