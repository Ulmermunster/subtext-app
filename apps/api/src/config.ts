const required = [
  'SPOTIFY_CLIENT_ID',
  'SPOTIFY_CLIENT_SECRET',
  'SPOTIFY_REDIRECT_URI',
  'DATABASE_URL',
  'REDIS_URL',
  'SESSION_SECRET',
  'APP_URL',
  'API_URL',
  'TOKEN_ENCRYPTION_KEY',
] as const;

type EnvKey = (typeof required)[number];

function validateEnv(): Record<EnvKey, string> {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  return Object.fromEntries(required.map((key) => [key, process.env[key]!])) as Record<EnvKey, string>;
}

export const env = validateEnv();
