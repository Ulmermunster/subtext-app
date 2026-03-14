import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#F6F4FF',
        white: '#FFFFFF',
        ink: '#18181B',
        muted: '#A1A1AA',
        border: '#E4E2F0',
        violet: '#7C3AED',
        coral: '#F97316',
        mint: '#10B981',
        sky: '#3B82F6',
        amber: '#F59E0B',
        spotify: '#1DB954',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '20px',
        pill: '999px',
      },
      boxShadow: {
        card: '0 2px 16px rgba(100,80,200,.05)',
      },
    },
  },
  plugins: [],
} satisfies Config;
