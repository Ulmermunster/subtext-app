/**
 * Bulletproof haptic feedback — designed to fire on raw pointer/touch events
 * (onPointerDown / onTouchStart) BEFORE React's synthetic onClick processing.
 *
 * Usage: <button onPointerDown={triggerHaptic} onClick={handleAction}>
 */

function canVibrate(): boolean {
  return typeof window !== 'undefined' && 'vibrate' in navigator;
}

/** Single strong pulse — use on onPointerDown for all interactive buttons */
export function triggerHaptic() {
  try {
    if (canVibrate()) navigator.vibrate(100);
  } catch {}
}

/** Double tap pattern — use sparingly for confirmations */
export function triggerHapticDouble() {
  try {
    if (canVibrate()) navigator.vibrate([60, 80, 60]);
  } catch {}
}
