import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Midnight Dark palette
        background: '#0a0a0f',
        surface: '#111116',
        'surface-dim': '#18181c',
        'surface-bright': '#1e1e24',
        'surface-container': '#151519',
        'surface-container-low': '#111116',
        'surface-container-high': '#1e1e24',
        white: '#FFFFFF',
        ink: '#ffffff',
        muted: '#6b7280',
        'outline-variant': '#374151',
        border: 'rgba(255,255,255,0.08)',

        // Primary – sunset pink
        primary: '#FF6B9D',
        'primary-container': '#FFB347',
        'primary-dim': '#e05a88',
        'on-primary': '#1a0a12',
        'on-primary-container': '#3d1800',

        // Secondary – neon cyan
        secondary: '#00CCCC',
        'secondary-container': '#0a3a3a',
        'on-secondary': '#003333',

        // Tertiary – muted lavender
        tertiary: '#9ca3af',
        'tertiary-container': '#1e1e24',

        // Error / accent
        error: '#ef4444',
        'error-container': '#7f1d1d',

        // Legacy aliases
        gold: '#FF6B9D',
        'gold-light': '#FFB347',
        'gold-pale': '#1e1e24',
        amber: '#FFB347',
        navy: '#0a0a0f',
        coral: '#ef4444',
        mint: '#00CCCC',
        sky: '#0a3a3a',
        spotify: '#1DB954',
        cream: '#151519',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        headline: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        body: ['"Be Vietnam Pro"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '1rem',
        lg: '2rem',
        xl: '3rem',
        card: '1rem',
        pill: '9999px',
        full: '9999px',
      },
      boxShadow: {
        card: '0 2px 12px rgba(0,0,0,.3), 0 4px 24px rgba(0,0,0,.2)',
        'card-hover': '0 4px 20px rgba(0,0,0,.4), 0 8px 32px rgba(0,0,0,.3)',
        glow: '0 0 60px rgba(255,107,157,.15)',
        glass: '0 12px 32px rgba(0,0,0,0.3)',
        sunset: '0 4px 24px rgba(255,107,157,.3), 0 0 48px rgba(255,179,71,.15)',
      },
    },
  },
  plugins: [],
} satisfies Config;
