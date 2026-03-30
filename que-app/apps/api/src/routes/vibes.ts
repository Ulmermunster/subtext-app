import { FastifyInstance } from 'fastify';
import { customAlphabet } from 'nanoid';
import { prisma } from '../lib/prisma.js';
import { getTrack, getRelatedArtists, getClientToken } from '../lib/spotify.js';
import { geolocateIp, getClientIp } from '../lib/geo.js';
import { env } from '../config.js';

const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6);

const FALLBACK_ARTISTS = [
  'Drake', 'Taylor Swift', 'Tame Impala', 'Billie Eilish', 'The Weeknd',
  'Dua Lipa', 'Kendrick Lamar', 'Olivia Rodrigo', 'Bad Bunny', 'SZA',
  'Harry Styles', 'Doja Cat', 'Post Malone', 'Ariana Grande', 'Travis Scott',
  'Radiohead', 'Frank Ocean', 'Lana Del Rey', 'Tyler, The Creator', 'Beyoncé',
];

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function resolveDecoys(artistId: string, realArtistName: string, token: string): Promise<string[]> {
  try {
    const related = await getRelatedArtists(artistId, token);
    const filtered = related.filter(name => name.toLowerCase() !== realArtistName.toLowerCase());
    if (filtered.length >= 3) return shuffle(filtered).slice(0, 3);
  } catch {}
  const pool = FALLBACK_ARTISTS.filter(name => name.toLowerCase() !== realArtistName.toLowerCase());
  return shuffle(pool).slice(0, 3);
}

async function findItunesPreview(title: string, artist: string): Promise<string | null> {
  try {
    const term = encodeURIComponent(`${title} ${artist}`);
    const res = await fetch(`https://itunes.apple.com/search?term=${term}&media=music&limit=3`);
    if (!res.ok) return null;
    const data = await res.json() as { results: Array<{ previewUrl?: string }> };
    return data.results?.[0]?.previewUrl || null;
  } catch {
    return null;
  }
}

export async function vibeRoutes(app: FastifyInstance) {
  // Create a vibe (no auth required — uses client credentials)
  app.post('/vibes/create', async (request, reply) => {
    const { trackId, mode, startSec, senderDisplayName, gameMode } = request.body as {
      trackId: string;
      mode: 'AUTO' | 'PICK';
      startSec?: number;
      senderDisplayName?: string;
      gameMode?: 'vibe' | 'guess';
    };

    if (!trackId || !mode) {
      return reply.status(400).send({ error: 'trackId and mode are required' });
    }

    // Fetch track info using app-level credentials (no user login needed)
    let token, track;
    try {
      token = await getClientToken(env.SPOTIFY_CLIENT_ID, env.SPOTIFY_CLIENT_SECRET);
      track = await getTrack(trackId, token);
    } catch (err) {
      request.log.error(err, 'Failed to fetch track from Spotify');
      return reply.status(502).send({ error: 'Could not fetch track info' });
    }

    const previewUrl = track.preview_url || null;

    // Resolve decoys server-side for guess mode
    const artistName = track.artists.map((a: any) => a.name).join(', ');
    const artistId = track.artists[0]?.id || '';
    let decoyArtists: string[] = [];
    if (gameMode === 'guess' && artistId) {
      decoyArtists = await resolveDecoys(artistId, artistName, token!);
    }

    const vibeId = nanoid();
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours

    // Capture sender location (non-blocking)
    const senderIp = getClientIp(request);
    const geo = await geolocateIp(senderIp).catch(() => ({ city: null, country: null }));

    const senderId = request.cookies.deviceId || null;

    await prisma.vibeToken.create({
      data: {
        id: vibeId,
        trackId: track.id,
        trackTitle: track.name,
        trackArtist: track.artists.map((a: any) => a.name).join(', '),
        albumName: track.album?.name || '',
        albumArt: track.album?.images?.[0]?.url || '',
        previewUrl,
        spotifyId: track.id,
        mode,
        startSec: startSec ?? null,
        senderDisplayName: senderDisplayName || 'Someone',
        senderId,
        senderIp: senderIp || null,
        senderCity: geo.city,
        senderCountry: geo.country,
        expiresAt,
        gameMode: gameMode || 'vibe',
        decoyArtists: decoyArtists.length > 0 ? JSON.stringify(decoyArtists) : null,
      },
    });

    return {
      vibeId,
      shareUrl: `${env.APP_URL}/v/${vibeId}`,
    };
  });

  // Get vibe public data (no auth required)
  app.get('/vibes/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const vibe = await prisma.vibeToken.findUnique({ where: { id } });

    if (!vibe || vibe.expiresAt < new Date()) {
      return reply.status(404).send({ error: 'Vibe not found or expired' });
    }

    // Mark as played on first access + capture receiver location & identity
    if (!vibe.playedAt) {
      const receiverIp = getClientIp(request);
      const receiverGeo = await geolocateIp(receiverIp).catch(() => ({ city: null, country: null }));
      const receiverId = request.cookies.deviceId || null;

      await prisma.vibeToken.update({
        where: { id },
        data: {
          playedAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // extend to 7 days
          receiverId: !vibe.receiverId ? receiverId : undefined,
          receiverIp: receiverIp || null,
          receiverCity: receiverGeo.city,
          receiverCountry: receiverGeo.country,
        },
      });
    }

    // NEVER return title, artist, albumName, albumArt in vibe mode
    // In guess mode, return decoys + real artist (shuffled) so client can render choices
    const base: Record<string, any> = {
      mode: vibe.mode,
      startSec: vibe.startSec,
      previewUrl: vibe.previewUrl,
      spotifyId: vibe.spotifyId,
      senderDisplayName: vibe.senderDisplayName,
      gameMode: vibe.gameMode,
    };

    if (vibe.gameMode === 'guess') {
      // Parse decoys and combine with real artist, shuffled
      let decoys: string[] = [];
      try { decoys = vibe.decoyArtists ? JSON.parse(vibe.decoyArtists) : []; } catch {}
      const choices = [...decoys, vibe.trackArtist];
      // Fisher-Yates shuffle
      for (let i = choices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [choices[i], choices[j]] = [choices[j], choices[i]];
      }
      base.artistChoices = choices;
      base.trackArtist = vibe.trackArtist; // needed for client-side correctness check
    }

    return base;
  });

  // Stream audio for a vibe (same-origin proxy — works on all mobile browsers)
  app.get('/vibes/:id/audio', async (request, reply) => {
    const { id } = request.params as { id: string };
    const vibe = await prisma.vibeToken.findUnique({ where: { id } });

    if (!vibe || vibe.expiresAt < new Date()) {
      return reply.status(404).send({ error: 'Not found' });
    }

    let audioUrl = vibe.previewUrl;

    // If no Spotify preview, search iTunes
    if (!audioUrl) {
      audioUrl = await findItunesPreview(vibe.trackTitle, vibe.trackArtist);
      // Cache it for next time
      if (audioUrl) {
        await prisma.vibeToken.update({ where: { id }, data: { previewUrl: audioUrl } }).catch(() => {});
      }
    }

    if (!audioUrl) {
      return reply.status(404).send({ error: 'No preview available' });
    }

    // Proxy the audio so it's served from our domain
    const upstream = await fetch(audioUrl);
    if (!upstream.ok) {
      return reply.status(502).send({ error: 'Audio unavailable' });
    }

    reply.header('Content-Type', upstream.headers.get('content-type') || 'audio/mpeg');
    reply.header('Accept-Ranges', 'none');
    reply.header('Cache-Control', 'public, max-age=3600');
    return reply.send(Buffer.from(await upstream.arrayBuffer()));
  });

  // React to a vibe (no auth required)
  app.post('/vibes/:id/react', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { reaction } = request.body as { reaction: 'VIBE' | 'NOPE' };

    if (!reaction || !['VIBE', 'NOPE'].includes(reaction)) {
      return reply.status(400).send({ error: 'reaction must be VIBE or NOPE' });
    }

    const vibe = await prisma.vibeToken.findUnique({ where: { id } });
    if (!vibe || vibe.expiresAt < new Date()) {
      return reply.status(404).send({ error: 'Vibe not found or expired' });
    }

    // After reveal, reaction is locked
    if (vibe.revealedAt) {
      return { reaction: vibe.reaction, locked: true };
    }

    await prisma.vibeToken.update({
      where: { id },
      data: {
        reaction,
        reactedAt: new Date(),
      },
    });

    // Update streak if this is a VIBE between two known devices
    if (reaction === 'VIBE' && vibe.senderId && request.cookies.deviceId) {
      const receiverId = request.cookies.deviceId;
      const senderId = vibe.senderId;
      // Normalize pair order so A→B and B→A share one row
      const [userAId, userBId] = [senderId, receiverId].sort();
      const now = new Date();
      const cutoff = new Date(now.getTime() - 48 * 60 * 60 * 1000);

      try {
        const existing = await prisma.streak.findUnique({
          where: { userAId_userBId: { userAId, userBId } },
        });

        if (existing) {
          const newCount = existing.lastVibeDate > cutoff
            ? existing.streakCount + 1
            : 1;
          await prisma.streak.update({
            where: { id: existing.id },
            data: { streakCount: newCount, lastVibeDate: now },
          });
        } else {
          await prisma.streak.create({
            data: { userAId, userBId, streakCount: 1, lastVibeDate: now },
          });
        }
      } catch {
        // Non-critical — don't fail the reaction if streak update errors
      }
    }

    return { success: true, reaction };
  });

  // Reveal vibe data (no auth required, but only after reaction or clip end)
  app.get('/vibes/:id/reveal', async (request, reply) => {
    const { id } = request.params as { id: string };
    const vibe = await prisma.vibeToken.findUnique({ where: { id } });

    if (!vibe || vibe.expiresAt < new Date()) {
      return reply.status(404).send({ error: 'Vibe not found or expired' });
    }

    // Gate: must have reacted OR enough time passed since playedAt
    const clipDuration = 30 * 1000; // 30 seconds
    const timeElapsed = vibe.playedAt ? Date.now() - vibe.playedAt.getTime() : 0;

    if (!vibe.reaction && timeElapsed < clipDuration) {
      return reply.status(403).send({ error: 'Reveal not yet available. React or wait for the clip to end.' });
    }

    // Lock reaction on reveal
    if (!vibe.revealedAt) {
      await prisma.vibeToken.update({
        where: { id },
        data: { revealedAt: new Date() },
      });
    }

    const artistQuery = encodeURIComponent(`${vibe.trackTitle} ${vibe.trackArtist}`);

    return {
      title: vibe.trackTitle,
      artist: vibe.trackArtist,
      albumName: vibe.albumName,
      albumArt: vibe.albumArt,
      spotifyUrl: `https://open.spotify.com/track/${vibe.spotifyId}`,
      appleMusicSearchUrl: `https://music.apple.com/search?term=${artistQuery}`,
      reaction: vibe.reaction,
    };
  });

  // Queue / History — returns sent and received vibes for the current device
  app.get('/vibes/history', async (request, reply) => {
    const deviceId = request.cookies.deviceId;
    if (!deviceId) {
      return { sent: [], received: [] };
    }

    const vibeSelect = {
      id: true,
      trackTitle: true,
      trackArtist: true,
      albumName: true,
      albumArt: true,
      spotifyId: true,
      senderDisplayName: true,
      senderId: true,
      receiverId: true,
      reaction: true,
      createdAt: true,
      playedAt: true,
      revealedAt: true,
    } as const;

    const [sent, received, streaks] = await Promise.all([
      prisma.vibeToken.findMany({
        where: { senderId: deviceId },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: vibeSelect,
      }),
      prisma.vibeToken.findMany({
        where: { receiverId: deviceId },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: vibeSelect,
      }),
      // Fetch all streaks involving this user
      prisma.streak.findMany({
        where: {
          OR: [{ userAId: deviceId }, { userBId: deviceId }],
          streakCount: { gt: 1 },
        },
      }),
    ]);

    // Build a lookup: partnerId -> streakCount
    const streakMap = new Map<string, number>();
    for (const s of streaks) {
      const partner = s.userAId === deviceId ? s.userBId : s.userAId;
      streakMap.set(partner, s.streakCount);
    }

    const addStreak = (item: any) => {
      const partnerId = item.senderId === deviceId ? item.receiverId : item.senderId;
      const streak = partnerId ? (streakMap.get(partnerId) || 0) : 0;
      const { senderId: _s, receiverId: _r, ...rest } = item;
      return { ...rest, streak };
    };

    return {
      sent: sent.map(addStreak),
      received: received.map(addStreak),
    };
  });
}
