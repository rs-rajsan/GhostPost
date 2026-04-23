import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        timeout: 120000,
        configure: (proxy) => {
          proxy.on('error', (err, _req, res) => {
            console.error('[Vite Proxy Error]', err.message);
          });
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log(`[Proxy] ${req.method} ${req.url}`);
          });
        }
      }
    }
  }
})
