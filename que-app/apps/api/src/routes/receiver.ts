import { FastifyInstance } from 'fastify';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

let receiverHtml: string | null = null;

function getReceiverHtml(): string {
  if (!receiverHtml) {
    // Try multiple possible paths (compiled vs source layout)
    const candidates = [
      join(__dirname, '..', '..', '..', 'receiver', 'index.html'),       // from dist/routes/ → apps/receiver/
      join(__dirname, '..', '..', 'receiver', 'index.html'),             // from dist/ → apps/receiver/ (if __dirname is dist/)
      join(__dirname, '..', '..', '..', '..', 'receiver', 'index.html'), // deeper nesting
    ];

    for (const candidate of candidates) {
      if (existsSync(candidate)) {
        receiverHtml = readFileSync(candidate, 'utf-8');
        console.log('Receiver HTML loaded from:', candidate);
        return receiverHtml;
      }
    }

    console.error('Receiver HTML not found. Tried:', candidates);
    console.error('__dirname is:', __dirname);
    throw new Error('Receiver HTML file not found');
  }
  return receiverHtml;
}

export async function receiverRoutes(app: FastifyInstance) {
  app.get('/v/:id', async (request, reply) => {
    try {
      const html = getReceiverHtml();
      reply.header('Content-Type', 'text/html');
      reply.header('Cache-Control', 'no-cache');
      return reply.send(html);
    } catch (err) {
      console.error('Failed to serve receiver page:', err);
      return reply.status(500).send({ error: 'Failed to load receiver page' });
    }
  });
}
