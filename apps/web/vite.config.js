import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(__dirname, '../..');

export default defineConfig({
  envDir: monorepoRoot,
  resolve: {
    alias: {
      '@recharge/shared': path.resolve(monorepoRoot, 'packages/shared'),
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'recharge-logo.png'],
      manifest: {
        name: 'Recharge',
        short_name: 'Recharge',
        description: 'Burnout & personality assessment',
        theme_color: '#003441',
        background_color: '#FAF9F6',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/favicon.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/favicon.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp}'],
      },
    }),
  ],
  server: {
    port: 5173,
    fs: {
      allow: [monorepoRoot],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
