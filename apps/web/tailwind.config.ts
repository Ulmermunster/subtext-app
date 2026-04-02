import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Core palette — Stitch design
        surface: '#000000',
        'on-surface': '#ffffff',
        primary: '#ec4899',
        'accent-yellow': '#facc15',

        // Extended surface tones
        background: '#000000',
        'surface-dim': '#0a0a0a',
        'surface-bright': '#1a1a1a',
        'surface-container': '#111111',
        'surface-container-low': '#0a0a0a',
        'surface-container-high': '#1a1a1a',
        white: '#FFFFFF',
        ink: '#ffffff',
        muted: '#6b7280',
        'outline-variant': '#374151',
        border: 'rgba(255,255,255,0.08)',

        // Primary tones
        'primary-container': '#facc15',
        'primary-dim': '#db2777',
        'on-primary': '#ffffff',
        'on-primary-container': '#422006',

        // Secondary – neon cyan (kept for discovery/receiver)
        secondary: '#00CCCC',
        'secondary-container': '#0a3a3a',
        'on-secondary': '#003333',

        // Tertiary
        tertiary: '#9ca3af',
        'tertiary-container': '#1a1a1a',

        // Error / accent
        error: '#ef4444',
        'error-container': '#7f1d1d',

        // Legacy aliases
        gold: '#ec4899',
        'gold-light': '#facc15',
        'gold-pale': '#1a1a1a',
        amber: '#facc15',
        navy: '#000000',
        coral: '#ef4444',
        mint: '#00CCCC',
        sky: '#0a3a3a',
        spotify: '#1DB954',
        cream: '#111111',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        headline: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        body: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        label: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
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
