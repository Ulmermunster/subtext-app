import { FastifyInstance } from 'fastify';
import { customAlphabet } from 'nanoid';
import { prisma } from '../lib/prisma.js';
import { requireSession } from '../middleware/session.js';
import { getTrack } from '../lib/spotify.js';
import { env } from '../config.js';

const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6);

export async function queRoutes(app: FastifyInstance) {
  // Create a que (requires auth)
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

    const queId = nanoid();
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours

    await prisma.queToken.create({
      data: {
        id: queId,
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
      vibeId: queId,
      shareUrl: `${env.APP_URL}/v/${queId}`,
    };
  });

  // Get que public data (no auth required)
  app.get('/vibes/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const que = await prisma.queToken.findUnique({ where: { id } });

    if (!que || que.expiresAt < new Date()) {
      return reply.status(404).send({ error: 'Clip not found or expired' });
    }

    // Mark as played on first access
    if (!que.playedAt) {
      await prisma.queToken.update({
        where: { id },
        data: {
          playedAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // extend to 7 days
        },
      });
    }

    // NEVER return title, artist, albumName, albumArt
    return {
      mode: que.mode,
      startSec: que.startSec,
      previewUrl: que.previewUrl,
      spotifyId: que.spotifyId,
      senderDisplayName: que.senderDisplayName,
    };
  });

  // React to a que (no auth required)
  app.post('/vibes/:id/react', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { reaction } = request.body as { reaction: 'VIBE' | 'NOPE' };

    if (!reaction || !['VIBE', 'NOPE'].includes(reaction)) {
      return reply.status(400).send({ error: 'reaction must be VIBE or NOPE' });
    }

    const que = await prisma.queToken.findUnique({ where: { id } });
    if (!que || que.expiresAt < new Date()) {
      return reply.status(404).send({ error: 'Clip not found or expired' });
    }

    // After reveal, reaction is locked
    if (que.revealedAt) {
      return { reaction: que.reaction, locked: true };
    }

    await prisma.queToken.update({
      where: { id },
      data: {
        reaction,
        reactedAt: new Date(),
      },
    });

    return { success: true, reaction };
  });

  // Reveal que data (no auth required, but only after reaction or clip end)
  app.get('/vibes/:id/reveal', async (request, reply) => {
    const { id } = request.params as { id: string };
    const que = await prisma.queToken.findUnique({ where: { id } });

    if (!que || que.expiresAt < new Date()) {
      return reply.status(404).send({ error: 'Clip not found or expired' });
    }

    // Gate: must have reacted OR enough time passed since playedAt
    const clipDuration = 30 * 1000; // 30 seconds
    const timeElapsed = que.playedAt ? Date.now() - que.playedAt.getTime() : 0;

    if (!que.reaction && timeElapsed < clipDuration) {
      return reply.status(403).send({ error: 'Reveal not yet available. React or wait for the clip to end.' });
    }

    // Lock reaction on reveal
    if (!que.revealedAt) {
      await prisma.queToken.update({
        where: { id },
        data: { revealedAt: new Date() },
      });
    }

    const artistQuery = encodeURIComponent(`${que.trackTitle} ${que.trackArtist}`);

    return {
      title: que.trackTitle,
      artist: que.trackArtist,
      albumName: que.albumName,
      albumArt: que.albumArt,
      spotifyUrl: `https://open.spotify.com/track/${que.spotifyId}`,
      appleMusicSearchUrl: `https://music.apple.com/search?term=${artistQuery}`,
      reaction: que.reaction,
    };
  });
}
