import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./frontend/tests/setup.ts'],
    include: [
      'frontend/tests/unit/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'frontend/tests/integration/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'backend/tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    // Run backend tests sequentially to avoid database locks
    testTimeout: 60000, // 60 seconds for database operations
    hookTimeout: 60000, // 60 seconds for hooks (cleanup)
    teardownTimeout: 60000, // 60 seconds for teardown
    pool: 'forks',
    // Vitest 4: poolOptions moved to top-level
    // Use fileThreads: 1 to ensure single-threaded execution
    fileThreads: 1,
    maxWorkers: 1,
    minWorkers: 1,
    sequence: {
      // Run tests sequentially to avoid database locks
      shuffle: false,
      concurrent: false
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'frontend/tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/**'
      ]
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './frontend/src')
    }
  }
});

