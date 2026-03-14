# Just Vibes 🎵

Share songs as blind listening experiences. The receiver hears a 30-second clip with zero metadata — no artist, no title, no album art — and must react before the song reveals itself.

## Architecture

```
apps/
  api/        Fastify backend (TypeScript, Prisma, Redis)
  web/        React sender app (Vite, TailwindCSS)
  receiver/   Vanilla HTML receiver page (inline CSS/JS, <50KB)
packages/
  types/      Shared TypeScript types
```

## Prerequisites

- Node.js 18+
- PostgreSQL
- Redis
- Spotify Developer App ([create one here](https://developer.spotify.com/dashboard))

## Spotify App Setup

1. Go to https://developer.spotify.com/dashboard
2. Create a new app
3. Add redirect URI: `http://localhost:3001/auth/spotify/callback`
4. Note your Client ID and Client Secret

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Copy environment variables
cp .env.example .env
# Edit .env with your Spotify credentials, database URL, Redis URL, etc.

# 3. Generate Prisma client and run migrations
cd apps/api && npx prisma generate && npx prisma migrate dev && cd ../..

# 4. Start development servers
npm run dev
```

This starts:
- API server on http://localhost:3001
- Web app on http://localhost:5173 (proxies API requests to :3001)

## How It Works

### Sender Flow
1. Connect Spotify (one-time OAuth login)
2. Search for a song
3. Choose clip mode: Auto (Spotify picks) or Pick (drag to select 30s window)
4. Tap "Text a friend" — opens native SMS with a mystery link

### Receiver Flow
1. Tap SMS link — lands on mobile web page (no login, no app, no Spotify needed)
2. Hear 30-second clip with hidden metadata
3. React: Vibe (👍) or Nope (👎) — clip continues playing
4. Clip ends → animated reveal: album art → title → artist → reaction badge
5. Confetti if they vibed! Then "Send one back" CTA

## Deployment

### Frontend (Vercel)
- Deploy `apps/web` as a Vite project
- Set `APP_URL` to your Vercel URL

### Backend (Railway)
- Deploy `apps/api` with PostgreSQL and Redis add-ons
- Set all environment variables from `.env.example`
- Update `SPOTIFY_REDIRECT_URI` to match your Railway URL
- The API serves the receiver page at `/v/:id`

## Environment Variables

| Variable | Description |
|---|---|
| `SPOTIFY_CLIENT_ID` | Spotify app client ID |
| `SPOTIFY_CLIENT_SECRET` | Spotify app client secret |
| `SPOTIFY_REDIRECT_URI` | OAuth callback URL |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `SESSION_SECRET` | Random secret for session cookies |
| `APP_URL` | Frontend URL (e.g., http://localhost:5173) |
| `API_URL` | Backend URL (e.g., http://localhost:3001) |
| `TOKEN_ENCRYPTION_KEY` | 32-byte hex string for AES-256-GCM encryption |
