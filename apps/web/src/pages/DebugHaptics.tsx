import { useState } from 'react';
import {
  hapticTap,
  hapticConfirm,
  hapticReveal,
  hapticError,
  getHapticDiagnostics,
  type HapticDiagnostics,
} from '../lib/haptics';

export default function DebugHaptics() {
  const [diag] = useState<HapticDiagnostics>(getHapticDiagnostics);
  const [log, setLog] = useState<string[]>([]);

  function addLog(msg: string) {
    const ts = new Date().toLocaleTimeString();
    setLog((prev) => [`[${ts}] ${msg}`, ...prev].slice(0, 50));
  }

  function testVibrateDirect() {
    if (typeof navigator.vibrate !== 'function') {
      addLog('navigator.vibrate is NOT a function — skipped');
      return;
    }
    const result = navigator.vibrate(200);
    addLog(`navigator.vibrate(200) returned: ${result}`);
  }

  return (
    <div
      className="w-full max-w-md mx-auto px-5 py-8"
      style={{ fontFamily: 'monospace', fontSize: '13px' }}
    >
      <h1 className="text-xl font-black italic text-primary mb-4 font-headline tracking-tighter">
        Haptics Debug
      </h1>

      {/* Platform detection */}
      <div className="glass-card p-4 mb-4 space-y-1">
        <h2 className="font-bold text-sm text-ink mb-2 font-headline">Platform Detection</h2>
        <Row label="navigator.vibrate exists" value={diag.hasVibrateAPI} />
        <Row label="Touch device (coarse)" value={diag.isTouchDevice} />
        <Row label="Expected path" value={diag.expectedPath} />
        <div className="text-[11px] text-muted break-all mt-2">
          UA: {diag.userAgent}
        </div>
      </div>

      {/* Test buttons */}
      <div className="glass-card p-4 mb-4 space-y-3">
        <h2 className="font-bold text-sm text-ink mb-2 font-headline">Fire Haptics</h2>
        <p className="text-[11px] text-muted mb-2">
          Each button fires on <b>onPointerDown</b> (haptic) + onClick (log).
          You should feel the vibration on finger-down, before release.
        </p>

        <HapticButton
          label="hapticTap() — 20ms"
          onPointerDown={hapticTap}
          onClick={() => addLog('hapticTap() fired')}
          color="linear-gradient(135deg, #FF6B9D, #FFB347)"
        />
        <HapticButton
          label="hapticConfirm() — [25,50,25]"
          onPointerDown={hapticConfirm}
          onClick={() => addLog('hapticConfirm() fired')}
          color="linear-gradient(135deg, #32626f, #b4e4f5)"
        />
        <HapticButton
          label="hapticReveal() — [30,60,30,80,100]"
          onPointerDown={hapticReveal}
          onClick={() => addLog('hapticReveal() fired')}
          color="linear-gradient(135deg, #6b7280, #3a3a4a)"
        />
        <HapticButton
          label="hapticError() — [15,40,15,40,15]"
          onPointerDown={hapticError}
          onClick={() => addLog('hapticError() fired')}
          color="linear-gradient(135deg, #b41340, #f74b6d)"
        />

        <hr className="border-white/20" />

        <HapticButton
          label="Raw vibrate(200) — direct call"
          onPointerDown={testVibrateDirect}
          onClick={() => addLog('Raw vibrate test fired')}
          color="linear-gradient(135deg, #00CCCC, #b4e4f5)"
        />
      </div>

      {/* Log output */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-sm text-ink font-headline">Log</h2>
          <button
            onClick={() => setLog([])}
            className="text-[11px] text-primary underline"
          >
            Clear
          </button>
        </div>
        <div className="space-y-1 max-h-60 overflow-y-auto">
          {log.length === 0 && (
            <div className="text-muted text-[11px]">
              Tap a button above to test...
            </div>
          )}
          {log.map((entry, i) => (
            <div key={i} className="text-[11px] text-ink">
              {entry}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: boolean | string;
}) {
  const display =
    typeof value === 'boolean' ? (value ? 'YES' : 'NO') : value;
  const color =
    typeof value === 'boolean'
      ? value
        ? '#00CCCC'
        : '#f74b6d'
      : '#9ca3af';

  return (
    <div className="flex justify-between">
      <span className="text-muted">{label}</span>
      <span style={{ color, fontWeight: 700 }}>{display}</span>
    </div>
  );
}

function HapticButton({
  label,
  onPointerDown,
  onClick,
  color,
}: {
  label: string;
  onPointerDown: () => void;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      onPointerDown={onPointerDown}
      onClick={onClick}
      className="w-full text-left px-4 py-3 rounded-xl text-white font-bold text-sm min-h-[48px] active:scale-[0.97] transition-transform"
      style={{ background: color }}
    >
      {label}
    </button>
  );
}
