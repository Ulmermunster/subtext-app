import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Sugar Rush palette
        background: '#f5f6fc',
        surface: '#f5f6fc',
        'surface-dim': '#d1d4dd',
        'surface-bright': '#f5f6fc',
        'surface-container': '#e6e8ef',
        'surface-container-low': '#eff0f7',
        'surface-container-high': '#e0e2ea',
        white: '#FFFFFF',
        ink: '#2c2f33',
        muted: '#595b61',
        'outline-variant': '#abadb3',
        border: '#dadde5',

        // Primary – deep rose / pink
        primary: '#9c3853',
        'primary-container': '#ff85a1',
        'primary-dim': '#8d2c48',
        'on-primary': '#ffeff0',
        'on-primary-container': '#5d0325',

        // Secondary – teal / cyan
        secondary: '#32626f',
        'secondary-container': '#b4e4f5',
        'on-secondary': '#dff7ff',

        // Tertiary – slate / lavender
        tertiary: '#595a6b',
        'tertiary-container': '#e6e6fa',

        // Error / accent
        error: '#b41340',
        'error-container': '#f74b6d',

        // Legacy aliases (keep existing refs working)
        gold: '#9c3853',
        'gold-light': '#ff85a1',
        'gold-pale': '#e6e6fa',
        amber: '#9c3853',
        navy: '#2c2f33',
        coral: '#f74b6d',
        mint: '#32626f',
        sky: '#b4e4f5',
        spotify: '#1DB954',
        cream: '#eff0f7',
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
        card: '0 2px 12px rgba(156,56,83,.06), 0 4px 24px rgba(156,56,83,.08)',
        'card-hover': '0 4px 20px rgba(156,56,83,.10), 0 8px 32px rgba(156,56,83,.14)',
        glow: '0 0 60px rgba(156,56,83,.15)',
        'glass': '0 12px 32px rgba(156,56,83,0.08)',
      },
    },
  },
  plugins: [],
} satisfies Config;
