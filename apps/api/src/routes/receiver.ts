import { FastifyInstance } from 'fastify';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

let receiverHtml: string | null = null;

function getReceiverHtml(): string {
  if (!receiverHtml) {
    receiverHtml = readFileSync(
      join(__dirname, '..', '..', '..', 'receiver', 'index.html'),
      'utf-8'
    );
  }
  return receiverHtml;
}

export async function receiverRoutes(app: FastifyInstance) {
  app.get('/v/:id', async (request, reply) => {
    reply.header('Content-Type', 'text/html');
    reply.header('Cache-Control', 'no-cache');
    return reply.send(getReceiverHtml());
  });
}
