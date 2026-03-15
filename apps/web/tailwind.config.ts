import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#FFF8E7',
        white: '#FFFFFF',
        ink: '#1A1A2E',
        muted: '#9CA3AF',
        border: '#F0E6C8',
        gold: '#F5A623',
        'gold-light': '#FFD96A',
        'gold-pale': '#FFF3D0',
        amber: '#F59E0B',
        navy: '#1A1A2E',
        coral: '#F97316',
        mint: '#10B981',
        sky: '#3B82F6',
        spotify: '#1DB954',
        cream: '#FFFBF0',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '20px',
        pill: '999px',
      },
      boxShadow: {
        card: '0 2px 16px rgba(200,170,80,.08)',
        'card-hover': '0 4px 24px rgba(200,170,80,.14)',
        glow: '0 0 60px rgba(245,166,35,.2)',
      },
    },
  },
  plugins: [],
} satisfies Config;
