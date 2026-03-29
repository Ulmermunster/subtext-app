/**
 * Unified haptics module — progressive enhancement for Android + iOS.
 *
 * Android: navigator.vibrate() — works inside user-gesture handlers.
 * iOS Safari 17.4+: hidden <input type="checkbox" switch> triggers Taptic Engine.
 * Desktop / unsupported: silent no-ops.
 *
 * IMPORTANT: All haptic functions MUST be called from a synchronous
 * user-gesture handler (onPointerDown, onClick, onTouchStart).
 * They will silently fail if called from setTimeout, Promise.then, etc.
 */

// ---------------------------------------------------------------------------
// Platform detection (runs once at module load)
// ---------------------------------------------------------------------------

const isAndroid =
  typeof navigator !== 'undefined' &&
  /android/i.test(navigator.userAgent);

const isIOS =
  typeof navigator !== 'undefined' &&
  /iP(hone|ad|od)/.test(navigator.userAgent);

const hasVibrateAPI =
  typeof navigator !== 'undefined' &&
  typeof navigator.vibrate === 'function';

/**
 * iOS Safari 17.4+ supports <input type="checkbox" switch> which triggers
 * the Taptic Engine when toggled. We test for this once at load time.
 */
const hasSwitchCheckbox: boolean = (() => {
  if (typeof document === 'undefined') return false;
  try {
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.setAttribute('switch', '');
    // If the browser supports it, .getAttribute('switch') won't be null
    // AND the element should serialize the attribute.
    return input.getAttribute('switch') !== null;
  } catch {
    return false;
  }
})();

// ---------------------------------------------------------------------------
// iOS checkbox-switch hack
// ---------------------------------------------------------------------------

/**
 * Creates a hidden checkbox-switch + label, programmatically clicks the label,
 * and cleans up. The browser fires native Taptic Engine feedback on toggle.
 *
 * Elements are positioned offscreen (not display:none — that prevents haptics).
 */
function iosHapticTick(): void {
  if (!hasSwitchCheckbox) return;

  const id = '__haptic_' + Math.random().toString(36).slice(2, 8);

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.setAttribute('switch', '');
  input.id = id;
  input.style.cssText =
    'position:fixed;left:-9999px;top:-9999px;opacity:0;pointer-events:none;';

  const label = document.createElement('label');
  label.setAttribute('for', id);
  label.style.cssText =
    'position:fixed;left:-9999px;top:-9999px;opacity:0;pointer-events:none;';

  document.body.appendChild(input);
  document.body.appendChild(label);

  // Programmatic click on the label toggles the checkbox → Taptic Engine fires
  label.click();

  // Clean up after the browser has processed the toggle
  requestAnimationFrame(() => {
    input.remove();
    label.remove();
  });
}

// ---------------------------------------------------------------------------
// Android vibrate wrapper
// ---------------------------------------------------------------------------

function androidVibrate(pattern: number | number[]): boolean {
  if (!hasVibrateAPI) return false;
  try {
    return navigator.vibrate(pattern);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Exported haptic functions
// ---------------------------------------------------------------------------

/**
 * Light tap — 20ms pulse for button interactions.
 * Call from onPointerDown or onClick (must be inside user gesture).
 */
export function hapticTap(): void {
  if (process.env.NODE_ENV === 'development') {
    console.debug('[haptics] hapticTap fired', { isAndroid, isIOS, hasVibrateAPI, hasSwitchCheckbox });
  }

  if (isIOS && hasSwitchCheckbox) {
    iosHapticTick();
    return;
  }

  if (hasVibrateAPI) {
    androidVibrate(20);
  }
}

/**
 * Confirmation — two quick pulses for success actions (e.g. Vibe reaction).
 */
export function hapticConfirm(): void {
  if (process.env.NODE_ENV === 'development') {
    console.debug('[haptics] hapticConfirm fired');
  }

  if (isIOS && hasSwitchCheckbox) {
    iosHapticTick();
    // iOS checkbox only does a single tick — can't do patterns.
    return;
  }

  if (hasVibrateAPI) {
    androidVibrate([25, 50, 25]);
  }
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
    console.debug('[haptics] hapticReveal fired');
  }

  if (isIOS && hasSwitchCheckbox) {
    iosHapticTick();
    return;
  }

  if (hasVibrateAPI) {
    // two short, pause, one long
    androidVibrate([30, 60, 30, 80, 100]);
  }
}

/**
 * Error feedback — three quick taps.
 */
export function hapticError(): void {
  if (process.env.NODE_ENV === 'development') {
    console.debug('[haptics] hapticError fired');
  }

  if (isIOS && hasSwitchCheckbox) {
    iosHapticTick();
    return;
  }

  if (hasVibrateAPI) {
    androidVibrate([15, 40, 15, 40, 15]);
  }
}

// ---------------------------------------------------------------------------
// Diagnostic info (for the debug page)
// ---------------------------------------------------------------------------

export interface HapticDiagnostics {
  isAndroid: boolean;
  isIOS: boolean;
  hasVibrateAPI: boolean;
  hasSwitchCheckbox: boolean;
  userAgent: string;
  expectedPath: 'android-vibrate' | 'ios-switch' | 'none';
}

export function getHapticDiagnostics(): HapticDiagnostics {
  let expectedPath: HapticDiagnostics['expectedPath'] = 'none';
  if (isIOS && hasSwitchCheckbox) expectedPath = 'ios-switch';
  else if (hasVibrateAPI) expectedPath = 'android-vibrate';

  return {
    isAndroid,
    isIOS,
    hasVibrateAPI,
    hasSwitchCheckbox,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    expectedPath,
  };
}
