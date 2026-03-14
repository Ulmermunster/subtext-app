export function openSms(senderName: string, vibeId: string, appUrl: string) {
  const message = `🎵 ${senderName} sent you a vibe.\n\nNo artist. No title. Just listen and react.\n\n→ ${appUrl}/v/${vibeId}`;
  window.location.href = `sms:?body=${encodeURIComponent(message)}`;
}
