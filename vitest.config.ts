import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [vue()],
  esbuild: {
    tsconfigRaw: {
      compilerOptions: {
        paths: {
          '@/*': ['./frontend/src/*']
        }
      }
    }
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./frontend/tests/setup.ts'],
    // Run backend tests sequentially to avoid database locks
    testTimeout: 60000,
    // 60 seconds for database operations
    hookTimeout: 60000,
    // 60 seconds for hooks (cleanup)
    teardownTimeout: 60000,
    // 60 seconds for teardown
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
      exclude: ['node_modules/', 'frontend/tests/', '**/*.d.ts', '**/*.config.*', '**/dist/**']
    },
    projects: [
      {
        extends: true,
        plugins: [
          storybookTest({
            configDir: path.join(dirname, '.storybook')
          })
        ],
        test: {
          name: 'storybook',
          include: [],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'chromium' }]
          },
          setupFiles: ['./.storybook/vitest.setup.ts']
        }
      },
      {
        extends: true,
        test: {
          name: 'main', // unit + integration + backend
          include: [
            'frontend/tests/unit/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
            'frontend/tests/integration/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
            'backend/tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
          ]
        }
      }
    ]
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './frontend/src')
    }
  }
});