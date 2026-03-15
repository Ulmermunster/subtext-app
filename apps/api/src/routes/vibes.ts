import { FastifyInstance } from 'fastify';
import { customAlphabet } from 'nanoid';
import { prisma } from '../lib/prisma.js';
import { requireSession } from '../middleware/session.js';
import { getTrack } from '../lib/spotify.js';
import { env } from '../config.js';

const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6);

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
  // Create a vibe (requires auth)
  app.post('/vibes/create', { preHandler: [requireSession] }, async (request, reply) => {
    const { trackId, mode, startSec } = request.body as {
      trackId: string;
      mode: 'AUTO' | 'PICK';
      startSec?: number;
    };

    if (!trackId || !mode) {
      return reply.status(400).send({ error: 'trackId and mode are required' });
    }

    // Fetch track info from Spotify
    const track = await getTrack(trackId, request.session!.accessToken);

    const previewUrl = track.preview_url || null;

    const vibeId = nanoid();
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours

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
        senderDisplayName: request.session!.displayName,
        expiresAt,
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

    // Mark as played on first access
    if (!vibe.playedAt) {
      await prisma.vibeToken.update({
        where: { id },
        data: {
          playedAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // extend to 7 days
        },
      });
    }

    // NEVER return title, artist, albumName, albumArt
    return {
      mode: vibe.mode,
      startSec: vibe.startSec,
      previewUrl: vibe.previewUrl,
      spotifyId: vibe.spotifyId,
      senderDisplayName: vibe.senderDisplayName,
    };
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
}
