import { FastifyInstance, FastifyRequest, FastifyReply, HookHandlerDoneFunction } from 'fastify';
import { prisma } from '../lib/prisma.js';

const ADMIN_SECRET = process.env.ADMIN_SECRET;

function requireAdmin(request: FastifyRequest, reply: FastifyReply, done: HookHandlerDoneFunction) {
  if (!ADMIN_SECRET) {
    reply.status(503).send({ error: 'Admin not configured' });
    return;
  }
  const auth = request.headers['x-admin-secret'] || (request.query as Record<string, string>)?.secret;
  if (auth !== ADMIN_SECRET) {
    reply.status(401).send({ error: 'Unauthorized' });
    return;
  }
  done();
}

export async function adminRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAdmin);

  // Dashboard stats
  app.get('/admin/stats', async (_request, reply) => {
    try {
    const now = new Date();

    const [
      totalVibes,
      totalPlayed,
      totalReacted,
      totalRevealed,
      pickModeCount,
      autoModeCount,
      vibeReactions,
      nopeReactions,
      todayVibes,
      weekVibes,
      recentVibes,
      topSenders,
      topTracks,
      locationStats,
    ] = await Promise.all([
      prisma.vibeToken.count(),
      prisma.vibeToken.count({ where: { playedAt: { not: null } } }),
      prisma.vibeToken.count({ where: { reaction: { not: null } } }),
      prisma.vibeToken.count({ where: { revealedAt: { not: null } } }),
      prisma.vibeToken.count({ where: { mode: 'PICK' } }),
      prisma.vibeToken.count({ where: { mode: 'AUTO' } }),
      prisma.vibeToken.count({ where: { reaction: 'VIBE' } }),
      prisma.vibeToken.count({ where: { reaction: 'NOPE' } }),
      prisma.vibeToken.count({
        where: { createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
      }),
      prisma.vibeToken.count({
        where: { createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } },
      }),
      prisma.vibeToken.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          trackTitle: true,
          trackArtist: true,
          mode: true,
          senderDisplayName: true,
          senderCity: true,
          senderCountry: true,
          receiverCity: true,
          receiverCountry: true,
          createdAt: true,
          playedAt: true,
          reaction: true,
          revealedAt: true,
        },
      }),
      // Top senders
      prisma.vibeToken.groupBy({
        by: ['senderDisplayName'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      // Top tracks
      prisma.vibeToken.groupBy({
        by: ['trackTitle', 'trackArtist'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      // Location breakdown
      prisma.vibeToken.groupBy({
        by: ['senderCity', 'senderCountry'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        where: { senderCity: { not: null } },
        take: 20,
      }),
    ]);

    // Unique senders (by display name)
    const uniqueSenders = await prisma.vibeToken.findMany({
      distinct: ['senderDisplayName'],
      select: { senderDisplayName: true },
    });

    // Daily send volume (last 14 days)
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const dailyVibes = await prisma.vibeToken.findMany({
      where: { createdAt: { gte: fourteenDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by day
    const dailyMap: Record<string, number> = {};
    for (const v of dailyVibes) {
      const day = v.createdAt.toISOString().slice(0, 10);
      dailyMap[day] = (dailyMap[day] || 0) + 1;
    }
    const dailyVolume = Object.entries(dailyMap).map(([date, count]) => ({ date, count }));

    // Completion funnel
    const playRate = totalVibes > 0 ? Math.round((totalPlayed / totalVibes) * 100) : 0;
    const reactRate = totalPlayed > 0 ? Math.round((totalReacted / totalPlayed) * 100) : 0;
    const revealRate = totalReacted > 0 ? Math.round((totalRevealed / totalReacted) * 100) : 0;
    const vibeRate = totalReacted > 0 ? Math.round((vibeReactions / totalReacted) * 100) : 0;

    return {
      overview: {
        totalVibes,
        totalPlayed,
        totalReacted,
        totalRevealed,
        uniqueSenders: uniqueSenders.length,
        todayVibes,
        weekVibes,
      },
      modes: { pick: pickModeCount, auto: autoModeCount },
      reactions: { vibe: vibeReactions, nope: nopeReactions },
      funnel: { playRate, reactRate, revealRate, vibeRate },
      dailyVolume,
      topSenders: topSenders.map((s: any) => ({
        name: s.senderDisplayName,
        count: s._count.id,
      })),
      topTracks: topTracks.map((t: any) => ({
        title: t.trackTitle,
        artist: t.trackArtist,
        count: t._count.id,
      })),
      locations: locationStats
        .filter((l: any) => l.senderCity)
        .map((l: any) => ({
          city: l.senderCity,
          country: l.senderCountry,
          count: l._count.id,
        })),
      recentVibes: recentVibes.map((v: any) => ({
        id: v.id,
        track: `${v.trackTitle} — ${v.trackArtist}`,
        mode: v.mode,
        sender: v.senderDisplayName,
        senderLocation: [v.senderCity, v.senderCountry].filter(Boolean).join(', ') || null,
        receiverLocation: [v.receiverCity, v.receiverCountry].filter(Boolean).join(', ') || null,
        createdAt: v.createdAt,
        played: !!v.playedAt,
        reaction: v.reaction,
        revealed: !!v.revealedAt,
      })),
    };
    } catch (err: any) {
      reply.log.error(err, 'Admin stats failed');
      return reply.status(500).send({ error: 'Failed to load stats' });
    }
  });
}
