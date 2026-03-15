import { prisma } from '../lib/prisma.js';

export function startCleanupJob() {
  // Run every hour
  setInterval(async () => {
    try {
      const result = await prisma.queToken.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });
      if (result.count > 0) {
        console.log(`Cleanup: deleted ${result.count} expired clips`);
      }
    } catch (err) {
      console.error('Cleanup job error:', err);
    }
  }, 60 * 60 * 1000);
}
