import { FastifyInstance } from 'fastify';
import { customAlphabet } from 'nanoid';
import { prisma } from '../lib/prisma.js';
import { requireSession } from '../middleware/session.js';
import { getTrack } from '../lib/spotify.js';
import { env } from '../config.js';

const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6);

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
    if (!previewUrl && mode === 'AUTO') {
      return reply.status(409).send({
        error: 'no_preview',
        message: "This track doesn't have a preview clip available. Try choosing a different song, or switch to Pick mode to select your own clip window.",
      });
    }

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
