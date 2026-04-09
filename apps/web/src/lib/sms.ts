export async function openSms(senderName: string, vibeId: string, appUrl: string) {
  const url = `${appUrl}/v/${vibeId}`;
  const message = `🎵 ${senderName} que'd you a song.\n\nNo artist. No title. Just listen and react.\n\n→ ${url}`;

  // Web Share API is the most reliable path on iOS — opens the native share sheet
  // so the user can pick Messages, WhatsApp, etc.
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ text: message });
      return;
    } catch (err: any) {
      // User dismissed the sheet — don't fall through
      if (err.name === 'AbortError') return;
      // Any other error: fall through to sms: scheme
    }
  }

  // Fallback: fire a programmatic anchor click for the sms: scheme.
  // Using an <a> click is more reliable than window.location.href on iOS
  // because Safari treats anchor navigation as a true user gesture.
  const a = document.createElement('a');
  a.href = `sms:?body=${encodeURIComponent(message)}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export async function copyLink(senderName: string, vibeId: string, appUrl: string) {
  const url = `${appUrl}/v/${vibeId}`;
  try {
    await navigator.clipboard.writeText(url);
  } catch {
    // Fallback for older browsers
    const input = document.createElement('input');
    input.value = url;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
  }
}
