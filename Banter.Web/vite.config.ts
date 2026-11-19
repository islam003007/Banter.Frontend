import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
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
      strictPort: true,
      proxy: {
        '/api': proxy,
        '/hubs': { ...proxy, ws: true },
      },
    },
    preview: {
      port: 4173,
      strictPort: true,
      proxy: {
        '/api': proxy,
        '/hubs': { ...proxy, ws: true },
      },
    },
    test: {
      environment: 'jsdom',
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
      setupFiles: ['./src/test/polyfills.ts', './src/test/setup.ts'],
      css: false,
      pool: 'vmThreads',
      restoreMocks: true,
      clearMocks: true,
      maxWorkers: 1,
      fileParallelism: false,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        reportsDirectory: './coverage',
        include: ['src/**/*.{ts,tsx}'],
        exclude: [
          'src/main.tsx',
          'src/vite-env.d.ts',
          'src/**/*.test.{ts,tsx}',
          'src/test/**',
          'src/styles/**',
        ],
      },
    },
  };
});
