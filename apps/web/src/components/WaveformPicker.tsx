import { useState, useRef, useCallback, useEffect } from 'react';

interface Props {
  durationMs: number;
  onWindowChange: (startSec: number) => void;
}

const BAR_COUNT = 44;
const CLIP_DURATION = 30; // seconds

function generateBars(): number[] {
  return Array.from({ length: BAR_COUNT }, (_, i) => {
    const x = i / BAR_COUNT;
    return 0.3 + 0.7 * Math.abs(Math.sin(x * Math.PI * 3.5 + 0.5) * Math.cos(x * Math.PI * 1.2));
  });
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function WaveformPicker({ durationMs, onWindowChange }: Props) {
  const totalSec = durationMs / 1000;
  const [startSec, setStartSec] = useState(Math.max(0, (totalSec - CLIP_DURATION) / 2));
  const bars = useRef(generateBars()).current;
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const maxStart = Math.max(0, totalSec - CLIP_DURATION);
  const windowStart = startSec / totalSec;
  const windowEnd = Math.min(1, (startSec + CLIP_DURATION) / totalSec);

  useEffect(() => {
    onWindowChange(Math.round(startSec));
  }, [startSec, onWindowChange]);

  const handlePointer = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const sec = pct * totalSec - CLIP_DURATION / 2;
      setStartSec(Math.max(0, Math.min(maxStart, sec)));
    },
    [totalSec, maxStart]
  );

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        className="relative h-20 flex items-end gap-[2px] cursor-grab active:cursor-grabbing select-none"
        onPointerDown={(e) => {
          dragging.current = true;
          handlePointer(e.clientX);
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (dragging.current) handlePointer(e.clientX);
        }}
        onPointerUp={() => {
          dragging.current = false;
        }}
      >
        {/* Dimmed overlay left */}
        <div
          className="absolute top-0 left-0 bottom-0 bg-ink/5 rounded-l-lg z-10 pointer-events-none"
          style={{ width: `${windowStart * 100}%` }}
        />
        {/* Dimmed overlay right */}
        <div
          className="absolute top-0 right-0 bottom-0 bg-ink/5 rounded-r-lg z-10 pointer-events-none"
          style={{ width: `${(1 - windowEnd) * 100}%` }}
        />
        {/* Selection window border */}
        <div
          className="absolute top-0 bottom-0 border-2 border-gold rounded-lg z-20 pointer-events-none"
          style={{ left: `${windowStart * 100}%`, width: `${(windowEnd - windowStart) * 100}%` }}
        />
        {/* Bars */}
        {bars.map((h, i) => {
          const barPct = i / BAR_COUNT;
          const inWindow = barPct >= windowStart && barPct <= windowEnd;
          return (
            <div
              key={i}
              className={`flex-1 rounded-sm transition-colors ${inWindow ? 'bg-gold' : 'bg-border'}`}
              style={{ height: `${h * 100}%` }}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-sm text-muted">
        <span>{formatTime(startSec)} → {formatTime(startSec + CLIP_DURATION)}</span>
        <span className="text-xs">Drag to choose</span>
      </div>
    </div>
  );
}
