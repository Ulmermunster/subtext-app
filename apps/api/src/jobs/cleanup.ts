import { prisma } from '../lib/prisma.js';

export function startCleanupJob() {
  // Run every hour
  setInterval(async () => {
    try {
      const result = await prisma.vibeToken.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });
      if (result.count > 0) {
        console.log(`Cleanup: deleted ${result.count} expired vibes`);
      }
    } catch (err) {
      console.error('Cleanup job error:', err);
    }
  }, 60 * 60 * 1000);
}
