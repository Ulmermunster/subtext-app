export function openSms(senderName: string, vibeId: string, appUrl: string) {
  const message = `🎵 ${senderName} que'd you a song.\n\nNo artist. No title. Just listen and react.\n\n→ ${appUrl}/v/${vibeId}`;
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const sep = isIOS ? '&' : '?';
  window.location.href = `sms:${sep}body=${encodeURIComponent(message)}`;
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
