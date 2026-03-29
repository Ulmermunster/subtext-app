/** Haptic feedback utility — fails silently on unsupported browsers */
export function hapticPop() {
  try { navigator?.vibrate?.(50); } catch {}
}

export function hapticDouble() {
  try { navigator?.vibrate?.([30, 50, 30]); } catch {}
}
