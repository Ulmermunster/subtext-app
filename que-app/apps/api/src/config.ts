const required = [
  'SPOTIFY_CLIENT_ID',
  'SPOTIFY_CLIENT_SECRET',
  'DATABASE_URL',
  'REDIS_URL',
  'SESSION_SECRET',
  'TOKEN_ENCRYPTION_KEY',
] as const;

type EnvKey = (typeof required)[number] | 'APP_URL' | 'API_URL' | 'SPOTIFY_REDIRECT_URI';

function validateEnv(): Record<EnvKey, string> {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  const port = process.env.PORT || '3001';
  const defaultUrl = `http://localhost:${port}`;

  const result = Object.fromEntries(required.map((key) => [key, process.env[key]!])) as Record<EnvKey, string>;
  result.APP_URL = process.env.APP_URL || defaultUrl;
  result.API_URL = process.env.API_URL || defaultUrl;
  result.SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || `${result.API_URL}/auth/spotify/callback`;
  return result;
}

export const env = validateEnv();
