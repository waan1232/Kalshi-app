import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/kalshi-api': {
        target: 'https://api.elections.kalshi.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/kalshi-api/, ''),
        secure: true,
        configure: (proxy) => {
          proxy.on('error', (err) => console.log('Kalshi proxy error:', err));
          proxy.on('proxyReq', (_, req) => console.log('Proxying:', req.url));
        },
      },
    },
  },
});