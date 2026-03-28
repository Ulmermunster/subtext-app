// Free IP geolocation via ip-api.com (no key needed, 45 req/min)
interface GeoResult {
  city: string | null;
  country: string | null;
}

export async function geolocateIp(ip: string): Promise<GeoResult> {
  // Skip private/local IPs
  if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('10.') || ip.startsWith('192.168.')) {
    return { city: null, country: null };
  }

  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=city,country,status`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return { city: null, country: null };
    const data = await res.json() as { status: string; city?: string; country?: string };
    if (data.status !== 'success') return { city: null, country: null };
    return { city: data.city || null, country: data.country || null };
  } catch {
    return { city: null, country: null };
  }
}

export function getClientIp(request: any): string {
  // Railway/proxy sets x-forwarded-for
  const forwarded = request.headers['x-forwarded-for'];
  if (forwarded) {
    const first = (typeof forwarded === 'string' ? forwarded : forwarded[0]).split(',')[0].trim();
    return first;
  }
  return request.ip || '';
}
