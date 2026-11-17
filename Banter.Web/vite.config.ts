import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.VITE_API_TARGET || 'http://localhost:8080';

  const proxy = {
    target,
    changeOrigin: true,
    secure: false,
  };

  return {
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: false,
      proxy: {
        '/api': proxy,
        '/hubs': { ...proxy, ws: true },
      },
    },
    preview: {
      port: 4173,
      proxy: {
        '/api': proxy,
        '/hubs': { ...proxy, ws: true },
      },
    },
  };
});
