/**
 * Unified haptics module — progressive enhancement for Android + iOS.
 *
 * Android/Chrome: navigator.vibrate() — works inside user-gesture handlers.
 * iOS Safari: <input type="checkbox" switch> inside a <label>, appended to
 *   document.head, clicked, and synchronously removed. Triggers Taptic Engine.
 * Desktop / unsupported: silent no-ops.
 *
 * IMPORTANT: All haptic functions MUST be called from a synchronous
 * user-gesture handler (onPointerDown, onClick, onTouchStart).
 * They will silently fail if called from setTimeout, Promise.then, etc.
 */

// ---------------------------------------------------------------------------
// Platform detection (runs once at module load)
// ---------------------------------------------------------------------------

const hasVibrateAPI =
  typeof navigator !== 'undefined' &&
  typeof navigator.vibrate === 'function';

/** Touch-capable device — used as guard for iOS checkbox path */
const isTouchDevice =
  typeof window !== 'undefined' &&
  window.matchMedia('(pointer: coarse)').matches;

// ---------------------------------------------------------------------------
// Core haptic tick — mirrors the ios-haptics library pattern
// ---------------------------------------------------------------------------

/**
 * Single haptic tick. Tries navigator.vibrate first (Android), then falls
 * back to the iOS checkbox-switch hack.
 *
 * The iOS approach: create a <label> containing an <input type="checkbox" switch>,
 * append to document.head (NOT body — avoids layout), click the label
 * (triggers Taptic Engine), remove synchronously.
 *
 * Reference: https://github.com/tijnjh/ios-haptics
 */
function tick(): void {
  try {
    // Android / Chrome path
    if (hasVibrateAPI) {
      navigator.vibrate(20);
      return;
    }

    // iOS Safari path — only attempt on touch devices
    if (!isTouchDevice) return;

    const label = document.createElement('label');
    label.ariaHidden = 'true';
    label.style.display = 'none';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.setAttribute('switch', '');
    label.appendChild(input);

    document.head.appendChild(label);
    label.click();
    document.head.removeChild(label);
  } catch {
    // Progressive enhancement — never throw
  }
}

// ---------------------------------------------------------------------------
// Exported haptic functions
// ---------------------------------------------------------------------------

/**
 * Light tap — single tick for button interactions.
 * Call from onPointerDown or onClick (must be inside user gesture).
 */
export function hapticTap(): void {
  if (process.env.NODE_ENV === 'development') {
    console.debug('[haptics] hapticTap', { hasVibrateAPI, isTouchDevice });
  }
  tick();
}

/**
 * Confirmation — two quick ticks for success actions (e.g. Vibe reaction).
 */
export function hapticConfirm(): void {
  if (process.env.NODE_ENV === 'development') {
    console.debug('[haptics] hapticConfirm');
  }

  if (hasVibrateAPI) {
    try { navigator.vibrate([25, 50, 25]); } catch {}
    return;
  }

  // iOS: two ticks spaced apart
  tick();
  setTimeout(tick, 120);
}

/**
 * Dramatic reveal pattern — for the song unmasking moment.
 * Two short pulses, pause, one long pulse.
 *
 * MUST be called from a user gesture (e.g. "Tap to reveal" button).
 * Will NOT work from setTimeout/setInterval.
 */
export function hapticReveal(): void {
  if (process.env.NODE_ENV === 'development') {
    console.debug('[haptics] hapticReveal');
  }

  if (hasVibrateAPI) {
    try { navigator.vibrate([30, 60, 30, 80, 100]); } catch {}
    return;
  }

  // iOS: three ticks for the reveal moment
  tick();
  setTimeout(tick, 120);
  setTimeout(tick, 240);
}

/**
 * Error feedback — three quick taps.
 */
export function hapticError(): void {
  if (process.env.NODE_ENV === 'development') {
    console.debug('[haptics] hapticError');
  }

  if (hasVibrateAPI) {
    try { navigator.vibrate([15, 40, 15, 40, 15]); } catch {}
    return;
  }

  // iOS: three ticks
  tick();
  setTimeout(tick, 120);
  setTimeout(tick, 240);
}

// ---------------------------------------------------------------------------
// Diagnostic info (for the debug page)
// ---------------------------------------------------------------------------

export interface HapticDiagnostics {
  hasVibrateAPI: boolean;
  isTouchDevice: boolean;
  expectedPath: 'vibrate-api' | 'ios-switch' | 'none';
  userAgent: string;
}

export function getHapticDiagnostics(): HapticDiagnostics {
  let expectedPath: HapticDiagnostics['expectedPath'] = 'none';
  if (hasVibrateAPI) expectedPath = 'vibrate-api';
  else if (isTouchDevice) expectedPath = 'ios-switch';

  return {
    hasVibrateAPI,
    isTouchDevice,
    expectedPath,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
  };
}
