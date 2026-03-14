import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/auth': 'http://localhost:3001',
      '/spotify': 'http://localhost:3001',
      '/vibes': 'http://localhost:3001',
      '/v': 'http://localhost:3001',
      '/health': 'http://localhost:3001',
    },
  },
});
